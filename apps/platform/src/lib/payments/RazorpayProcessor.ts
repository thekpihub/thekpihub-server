/**
 * Razorpay Payment Processor Implementation
 * Handles Razorpay-specific payment creation and webhook processing
 */

import crypto from "node:crypto";
import type {
  CheckoutSession,
  CheckoutSessionRequest,
  PaymentProcessor,
  PaymentVerification,
  WebhookEventData,
} from "./types";

interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, unknown>;
  created_at: number;
}

export class RazorpayProcessor implements PaymentProcessor {
  private keyId: string;
  private keySecret: string;
  // Separate from keySecret on purpose: Razorpay signs webhook deliveries
  // with the webhook secret you set when registering the webhook URL in
  // the dashboard, NOT with the API key secret used to create orders.
  // Reusing keySecret here (as this class previously did) makes every real
  // webhook call fail signature verification -- fixed 2026-09-04.
  private webhookSecret: string;
  private baseUrl = "https://api.razorpay.com/v1";

  constructor(keyId?: string, keySecret?: string, webhookSecret?: string) {
    this.keyId = keyId || process.env.RAZORPAY_KEY_ID || "";
    this.keySecret = keySecret || process.env.RAZORPAY_KEY_SECRET || "";
    this.webhookSecret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || "";

    if (!this.keyId || !this.keySecret) {
      throw new Error("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) not configured");
    }
  }

  async createCheckout(request: CheckoutSessionRequest): Promise<CheckoutSession> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");

    const orderData = {
      amount: request.amount, // Amount in paisa (INR smallest unit)
      currency: "INR",
      receipt: `order_${request.userId}_${Date.now()}`,
      notes: {
        user_id: request.userId,
        plan: request.planId,
        email: request.email,
      },
    };

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Razorpay order creation failed: ${JSON.stringify(error)}`);
    }

    const order = (await response.json()) as RazorpayOrder;

    return {
      id: order.id,
      url: `https://checkout.razorpay.com/?key_id=${this.keyId}&order_id=${order.id}`,
      currency: "INR",
      amount: order.amount,
      processor: "razorpay",
    };
  }

  async handleWebhook(data: WebhookEventData): Promise<PaymentVerification> {
    if (!data.rawBody || !data.signature) {
      return { isValid: false };
    }

    if (!this.webhookSecret) {
      throw new Error(
        "RAZORPAY_WEBHOOK_SECRET not configured -- set it to the secret shown when " +
          "registering this webhook URL in the Razorpay dashboard (Settings > Webhooks). " +
          "It is NOT the same value as RAZORPAY_KEY_SECRET."
      );
    }

    // Verify signature against the webhook secret (see constructor note --
    // this is deliberately not this.keySecret).
    if (!this.validateSignature(data.signature, data.rawBody, this.webhookSecret)) {
      return { isValid: false };
    }

    const payload = data.payload;

    // Handle payment.authorized event
    if (data.processorEventType === "payment.authorized") {
      const payment = payload.payment as Record<string, unknown> | undefined;
      if (!payment) {
        return { isValid: false };
      }

      const notes = payment.notes as Record<string, unknown> | undefined;
      const userId = notes?.user_id as string | undefined;
      const plan = notes?.plan as string | undefined;

      return {
        isValid: true,
        userId,
        plan,
        amount: payment.amount as number | undefined,
        currency: "INR",
        orderId: payment.order_id as string | undefined,
      };
    }

    // Handle payment.captured event (for subscription-like payments)
    if (data.processorEventType === "payment.captured") {
      const payment = payload.payment as Record<string, unknown> | undefined;
      if (!payment) {
        return { isValid: false };
      }

      const notes = payment.notes as Record<string, unknown> | undefined;
      const userId = notes?.user_id as string | undefined;
      const plan = notes?.plan as string | undefined;

      return {
        isValid: true,
        userId,
        plan,
        amount: payment.amount as number | undefined,
        currency: "INR",
        orderId: payment.order_id as string | undefined,
      };
    }

    return { isValid: false };
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
    return "razorpay" as const;
  }

  getSupportedCurrency() {
    return "INR" as const;
  }
}
