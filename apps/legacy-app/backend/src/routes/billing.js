const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const billingController = require('../controllers/billingController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const validate = require('../middleware/validate');

// Webhooks — no auth, signature-verified
router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), billingController.razorpayWebhook);
router.post('/webhook/stripe',   express.raw({ type: 'application/json' }), billingController.stripeWebhook);

router.use(authenticate);
router.use(requireRole('admin', 'super_admin'));

router.get('/plans',        billingController.listPlans);
router.get('/subscription', billingController.getSubscription);
router.get('/invoices',     billingController.getInvoices);
router.get('/limits/:resource', billingController.checkLimit);

router.post('/subscribe',
  [body('planSlug').notEmpty(), body('gateway').isIn(['razorpay','stripe'])],
  validate, billingController.startSubscription
);
router.post('/change-plan', body('planSlug').notEmpty(), validate, billingController.changePlan);
router.post('/cancel',      body('reason').notEmpty(),   validate, billingController.cancelSubscription);
router.post('/verify-payment',
  [body('paymentId').notEmpty(), body('signature').notEmpty()],
  validate, billingController.verifyPayment
);
router.post('/portal', billingController.createPortalSession);

module.exports = router;
