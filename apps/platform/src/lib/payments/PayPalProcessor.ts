/**
 * PayPal Payment Processor Implementation
 * Handles PayPal-specific payment creation and webhook processing
 */

import crypto from "node:crypto";
import type {
  CheckoutSession,
  CheckoutSessionRequest,
  PaymentProcessor,
  PaymentVerification,
  WebhookEventData,
} from "./types";

interface PayPalToken {
  access_token: string;
  expires_in: number;
}

interface PayPalOrder {
  id: string;
  status: string;
  links: Array<{
    rel: string;
    href: string;
  }>;
}

interface PayPalCaptureResult {
  id: string;
  status: string;
  purchase_units?: Array<{
    custom_id?: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        custom_id?: string;
        amount?: { currency_code: string; value: string };
      }>;
    };
  }>;
}

// custom_id is a single free-text field PayPal echoes back unchanged on
// capture responses and webhook events -- pack both fields we need to
// recover into it (":"  can't appear in either a UUID userId or a plan
// slug, so a simple split is safe).
function encodeCustomId(userId: string, plan: string): string {
  return `${userId}:${plan}`;
}

function decodeCustomId(customId: string | undefined): { userId?: string; plan?: string } {
  if (!customId) return {};
  const [userId, plan] = customId.split(":");
  return { userId: userId || undefined, plan: plan || undefined };
}

export class PayPalProcessor implements PaymentProcessor {
  private clientId: string;
  private clientSecret: string;
  private webhookId: string;
  private baseUrl: string;
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(clientId?: string, clientSecret?: string, webhookId?: string) {
    this.clientId = clientId || process.env.PAYPAL_CLIENT_ID || "";
    this.clientSecret = clientSecret || process.env.PAYPAL_CLIENT_SECRET || "";
    this.webhookId = webhookId || process.env.PAYPAL_WEBHOOK_ID || "";
    this.baseUrl = process.env.PAYPAL_MODE === "live" ? "https://api.paypal.com" : "https://api.sandbox.paypal.com";

    if (!this.clientId || !this.clientSecret) {
      throw new Error("PayPal credentials (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET) not configured");
    }
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal token creation failed: ${JSON.stringify(error)}`);
    }

    const data = (await response.json()) as PayPalToken;
    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000 - 60000, // Refresh 1 min before expiry
    };

    return data.access_token;
  }

  private getCurrencyFromAmount(amount: number): "USD" | "INR" {
    // For simplicity, use USD by default. In production, detect from user region
    return "USD";
  }

  async createCheckout(request: CheckoutSessionRequest): Promise<CheckoutSession> {
    const accessToken = await this.getAccessToken();
    const currency = this.getCurrencyFromAmount(request.amount);
    const amountInDollars = (request.amount / 100).toFixed(2);

    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `order_${request.userId}_${Date.now()}`,
          amount: {
            currency_code: currency,
            value: amountInDollars,
          },
          // Encodes both userId and plan so the capture response and the
          // webhook (which get this field echoed back, see handleWebhook
          // below) can recover which plan to grant without a separate
          // lookup -- previously only userId was stored here, so plan
          // info was silently lost by the time capture/webhook ran.
          custom_id: encodeCustomId(request.userId, request.planId),
          description: `Subscription: ${request.planId.toUpperCase()}`,
        },
      ],
      application_context: {
        brand_name: "TheKPIHub",
        user_action: "PAY_NOW",
        // PayPal does not support a "{ORDER_ID}" template placeholder in
        // return_url (the previous value here was dead syntax that would
        // have been sent to PayPal literally) -- it appends its own
        // `token` (the order ID) and `PayerID` query params to whatever
        // URL is given. The billing page reads `token` after redirect and
        // calls POST /api/paypal/capture with it.
        return_url: `${request.appUrl}/dashboard/billing?paypal_return=1`,
        cancel_url: `${request.appUrl}/dashboard/billing?paypal_cancelled=1`,
      },
    };

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal order creation failed: ${JSON.stringify(error)}`);
    }

    const order = (await response.json()) as PayPalOrder;

    // Find the approve link
    const approveLink = order.links.find((link) => link.rel === "approve");

    return {
      id: order.id,
      url: approveLink?.href,
      currency,
      amount: request.amount,
      processor: "paypal",
    };
  }

  async handleWebhook(data: WebhookEventData): Promise<PaymentVerification> {
    if (!data.rawBody || !data.signature) {
      return { isValid: false };
    }

    const isValid = await this.verifyPayPalSignature(data);

    if (!isValid) {
      return { isValid: false };
    }

    const payload = data.payload;

    // Handle CHECKOUT.ORDER.COMPLETED event
    if (data.processorEventType === "CHECKOUT.ORDER.COMPLETED") {
      const resource = payload.resource as Record<string, unknown> | undefined;
      if (!resource) {
        return { isValid: false };
      }

      const purchaseUnits = resource.purchase_units as Array<Record<string, unknown>> | undefined;
      const firstUnit = purchaseUnits?.[0];
      const amount = firstUnit?.amount as Record<string, unknown> | undefined;
      const { userId, plan } = decodeCustomId(firstUnit?.custom_id as string | undefined);

      return {
        isValid: true,
        userId,
        plan,
        amount: amount?.value ? parseInt(amount.value as string) * 100 : undefined, // Convert to cents
        currency: (amount?.currency_code as "USD" | "INR" | undefined) || "USD",
        orderId: resource.id as string | undefined,
      };
    }

    // Handle PAYMENT.CAPTURE.COMPLETED event. The webhook resource here is
    // the Capture object itself, which carries custom_id as a top-level
    // field (echoed straight from the order's purchase_units[0].custom_id)
    // -- NOT nested under a "supplementary_data.additional_data.plan" path
    // that nothing in this codebase ever wrote to.
    if (data.processorEventType === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = payload.resource as Record<string, unknown> | undefined;
      if (!resource) {
        return { isValid: false };
      }

      const amount = resource.amount as Record<string, unknown> | undefined;
      const { userId, plan } = decodeCustomId(resource.custom_id as string | undefined);

      return {
        isValid: true,
        userId,
        plan,
        amount: amount?.value ? parseInt(amount.value as string) * 100 : undefined,
        currency: (amount?.currency_code as "USD" | "INR" | undefined) || "USD",
        orderId: resource.id as string | undefined,
      };
    }

    return { isValid: false };
  }

  /**
   * Capture a buyer-approved order. This is the step that was previously
   * missing entirely from the codebase -- an order created via
   * createCheckout() and approved by the buyer was never actually charged
   * because nothing called PayPal's capture endpoint afterwards. Called
   * from POST /api/paypal/capture after PayPal redirects the buyer back.
   */
  async captureOrder(orderId: string): Promise<PayPalCaptureResult> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const result = (await response.json()) as PayPalCaptureResult;

    if (!response.ok) {
      throw new Error(`PayPal order capture failed: ${JSON.stringify(result)}`);
    }

    return result;
  }

  /**
   * Calls PayPal's real webhook signature verification endpoint
   * (POST /v1/notifications/verify-webhook-signature). The previous
   * implementation only regex-checked that the signature looked like a
   * 256-char hex string and accepted anything matching that shape --
   * meaning any caller could forge a webhook call and grant themselves a
   * plan. Requires PAYPAL_WEBHOOK_ID (the webhook's ID from the PayPal
   * dashboard, distinct from the client ID/secret) and the raw PayPal
   * webhook headers, passed through via WebhookEventData.headers.
   */
  private async verifyPayPalSignature(data: WebhookEventData): Promise<boolean> {
    if (!this.webhookId) {
      throw new Error(
        "PAYPAL_WEBHOOK_ID not configured -- set it to the webhook's ID from " +
          "the PayPal dashboard (Developer Dashboard > Webhooks), not the client ID/secret."
      );
    }

    const headers = data.headers || {};
    const transmissionId = headers["paypal-transmission-id"];
    const transmissionTime = headers["paypal-transmission-time"];
    const certUrl = headers["paypal-cert-url"];
    const authAlgo = headers["paypal-auth-algo"];

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !data.signature) {
      return false;
    }

    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: data.signature,
          transmission_time: transmissionTime,
          webhook_id: this.webhookId,
          webhook_event: data.payload,
        }),
        cache: "no-store",
      });

      if (!response.ok) return false;

      const result = (await response.json()) as { verification_status?: string };
      return result.verification_status === "SUCCESS";
    } catch {
      return false;
    }
  }

  validateSignature(signature: string, payload: string, secret: string): boolean {
    try {
      const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      );
    } catch {
      return false;
    }
  }

  getProcessorType() {
    return "paypal" as const;
  }

  getSupportedCurrency() {
    return "USD" as const;
  }
}
