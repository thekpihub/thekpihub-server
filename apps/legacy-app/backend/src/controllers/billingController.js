const crypto = require('crypto');
const { query } = require('../config/database');
const response = require('../utils/response');
const audit    = require('../utils/audit');
const logger   = require('../config/logger');

// Lazy-load payment gateways to avoid boot crashes when keys are missing
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  const Razorpay = require('razorpay');
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
};

const billingController = {
  listPlans: async (req, res, next) => {
    try {
      const plans = await query(`SELECT id, name, slug, description, billing_cycle, price_inr, price_usd, features, max_kpis, max_users, max_dashboards, sort_order FROM billing.plans WHERE is_active=true AND is_public=true ORDER BY sort_order ASC`);
      return response.success(res, plans.rows);
    } catch (err) { next(err); }
  },

  getSubscription: async (req, res, next) => {
    try {
      const sub = await query(
        `SELECT s.*, p.name AS plan_name, p.slug AS plan_slug, p.features, p.max_kpis, p.max_users, p.max_dashboards, p.price_inr
         FROM billing.subscriptions s JOIN billing.plans p ON s.plan_id=p.id
         WHERE s.org_id=$1 AND s.status IN ('active','trialing') ORDER BY s.created_at DESC LIMIT 1`,
        [req.user.org_id]
      );
      return response.success(res, sub.rows[0] || { status: 'no_subscription', plan_slug: 'free' });
    } catch (err) { next(err); }
  },

  startSubscription: async (req, res, next) => {
    try {
      const { planSlug, gateway = 'razorpay' } = req.body;
      const plan = await query(`SELECT * FROM billing.plans WHERE slug=$1 AND is_active=true`, [planSlug]);
      if (!plan.rows[0]) return response.error(res, 'Plan not found', 404);

      await query(
        `INSERT INTO billing.subscriptions (org_id, plan_id, status, payment_gateway, current_period_start, current_period_end)
         VALUES ($1,$2,'trialing',$3,NOW(),NOW() + INTERVAL '14 days')
         ON CONFLICT (org_id) DO UPDATE SET plan_id=EXCLUDED.plan_id, status='trialing', payment_gateway=EXCLUDED.payment_gateway, current_period_end=EXCLUDED.current_period_end, updated_at=NOW()`,
        [req.user.org_id, plan.rows[0].id, gateway]
      );

      await audit({ userId: req.user.id, orgId: req.user.org_id, action: 'billing.subscription.start', entityType: 'subscription', newValues: { planSlug, gateway }, req });
      return response.created(res, { planSlug, gateway, razorpayKeyId: process.env.RAZORPAY_KEY_ID });
    } catch (err) { next(err); }
  },

  changePlan: async (req, res, next) => {
    try {
      const { planSlug } = req.body;
      const plan = await query(`SELECT id FROM billing.plans WHERE slug=$1`, [planSlug]);
      if (!plan.rows[0]) return response.error(res, 'Plan not found', 404);

      const updated = await query(`UPDATE billing.subscriptions SET plan_id=$1, updated_at=NOW() WHERE org_id=$2 RETURNING *`, [plan.rows[0].id, req.user.org_id]);
      await audit({ userId: req.user.id, orgId: req.user.org_id, action: 'billing.plan.change', entityType: 'subscription', newValues: { planSlug }, req });
      return response.success(res, updated.rows[0], 'Plan updated successfully');
    } catch (err) { next(err); }
  },

  cancelSubscription: async (req, res, next) => {
    try {
      const { reason, immediate = false } = req.body;
      const status = immediate ? 'cancelled' : 'active';

      await query(
        `UPDATE billing.subscriptions SET status=$1, cancelled_at=NOW(), metadata=metadata||$2, updated_at=NOW() WHERE org_id=$3`,
        [status, JSON.stringify({ cancellation_reason: reason }), req.user.org_id]
      );
      await audit({ userId: req.user.id, orgId: req.user.org_id, action: 'billing.subscription.cancel', entityType: 'subscription', newValues: { reason, immediate }, req });
      return response.success(res, { cancelled: true, immediate }, immediate ? 'Subscription cancelled' : 'Subscription will cancel at end of billing period');
    } catch (err) { next(err); }
  },

  verifyPayment: async (req, res, next) => {
    try {
      const { orderId, paymentId, signature, subscriptionId } = req.body;
      const secret = process.env.RAZORPAY_KEY_SECRET;

      const body     = subscriptionId ? `${paymentId}|${subscriptionId}` : `${orderId}|${paymentId}`;
      const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

      if (expected !== signature) return response.error(res, 'Invalid payment signature', 400);

      await query(`UPDATE billing.subscriptions SET status='active', updated_at=NOW() WHERE org_id=$1`, [req.user.org_id]);
      return response.success(res, { verified: true }, 'Payment verified successfully');
    } catch (err) { next(err); }
  },

  createPortalSession: async (req, res, next) => {
    try {
      const stripe = getStripe();
      if (!stripe) return response.error(res, 'Stripe not configured', 503);

      const sub = await query(`SELECT metadata FROM billing.subscriptions WHERE org_id=$1 LIMIT 1`, [req.user.org_id]);
      const customerId = sub.rows[0]?.metadata?.customerId;
      if (!customerId) return response.error(res, 'No Stripe customer found', 404);

      const session = await stripe.billingPortal.sessions.create({
        customer:   customerId,
        return_url: `${process.env.FRONTEND_URL}/settings/billing`,
      });
      return response.success(res, { url: session.url });
    } catch (err) { next(err); }
  },

  getInvoices: async (req, res, next) => {
    try {
      const invoices = await query(
        `SELECT i.*, p.name AS plan_name FROM billing.invoices i LEFT JOIN billing.subscriptions s ON i.subscription_id=s.id LEFT JOIN billing.plans p ON s.plan_id=p.id WHERE i.org_id=$1 ORDER BY i.created_at DESC LIMIT 24`,
        [req.user.org_id]
      );
      return response.success(res, invoices.rows);
    } catch (err) { next(err); }
  },

  checkLimit: async (req, res, next) => {
    try {
      const { resource } = req.params;
      const orgId = req.user.org_id;

      const sub = await query(`SELECT p.max_${resource} FROM billing.subscriptions s JOIN billing.plans p ON s.plan_id=p.id WHERE s.org_id=$1 AND s.status IN ('active','trialing') LIMIT 1`, [orgId]);
      const limit = sub.rows[0]?.[`max_${resource}`];

      if (limit === -1) return response.success(res, { allowed: true, limit: -1, current: null });

      const usage = await query(`SELECT COUNT(*) AS count FROM kpis.${resource} WHERE org_id=$1 AND status='active'`, [orgId]);
      const current = parseInt(usage.rows[0].count);

      return response.success(res, { allowed: current < (limit || 0), current, limit });
    } catch (err) { next(err); }
  },

  razorpayWebhook: async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const expected  = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '').update(JSON.stringify(req.body)).digest('hex');

      if (expected !== signature) {
        logger.warn('Invalid Razorpay webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const { event, payload } = req.body;
      logger.info('Razorpay webhook', { event });

      if (event === 'subscription.charged') {
        const sub = payload.subscription.entity;
        await query(`UPDATE billing.subscriptions SET status='active', current_period_start=TO_TIMESTAMP($1), current_period_end=TO_TIMESTAMP($2), updated_at=NOW() WHERE gateway_subscription_id=$3`, [sub.current_start, sub.current_end, sub.id]);
      } else if (event === 'subscription.payment.failed') {
        await query(`UPDATE billing.subscriptions SET status='past_due', updated_at=NOW() WHERE gateway_subscription_id=$1`, [payload.subscription.entity.id]);
      } else if (event === 'subscription.cancelled') {
        await query(`UPDATE billing.subscriptions SET status='cancelled', cancelled_at=NOW(), updated_at=NOW() WHERE gateway_subscription_id=$1`, [payload.subscription.entity.id]);
      }

      return res.status(200).json({ received: true });
    } catch (err) {
      logger.error('Razorpay webhook error', { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  },

  stripeWebhook: async (req, res) => {
    try {
      const stripe = getStripe();
      if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });

      const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET || '');
      logger.info('Stripe webhook', { type: event.type });

      if (event.type === 'invoice.payment_succeeded') {
        const inv = event.data.object;
        await query(`UPDATE billing.subscriptions SET status='active', updated_at=NOW() WHERE gateway_subscription_id=$1`, [inv.subscription]);
      } else if (event.type === 'invoice.payment_failed') {
        await query(`UPDATE billing.subscriptions SET status='past_due', updated_at=NOW() WHERE gateway_subscription_id=$1`, [event.data.object.subscription]);
      } else if (event.type === 'customer.subscription.deleted') {
        await query(`UPDATE billing.subscriptions SET status='cancelled', cancelled_at=NOW(), updated_at=NOW() WHERE gateway_subscription_id=$1`, [event.data.object.id]);
      }

      return res.status(200).json({ received: true });
    } catch (err) {
      logger.error('Stripe webhook error', { error: err.message });
      return res.status(400).json({ error: err.message });
    }
  },
};

module.exports = billingController;
