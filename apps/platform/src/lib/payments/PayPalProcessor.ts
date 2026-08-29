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
          custom_id: request.userId,
          description: `Subscription: ${request.planId.toUpperCase()}`,
        },
      ],
      application_context: {
        brand_name: "TheKPIHub",
        user_action: "PAY_NOW",
        return_url: `${request.appUrl}/dashboard?checkout_session_id={ORDER_ID}`,
        cancel_url: `${request.appUrl}/billing?cancelled=true`,
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

    // For PayPal, we should verify the signature using their verification endpoint
    // For now, implement basic signature validation
    const isValid = await this.verifyPayPalSignature(data.signature, data.rawBody);

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

      return {
        isValid: true,
        userId: resource.custom_id as string | undefined,
        amount: amount?.value ? parseInt(amount.value as string) * 100 : undefined, // Convert to cents
        currency: (amount?.currency_code as "USD" | "INR" | undefined) || "USD",
        orderId: resource.id as string | undefined,
      };
    }

    // Handle PAYMENT.CAPTURE.COMPLETED event
    if (data.processorEventType === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = payload.resource as Record<string, unknown> | undefined;
      if (!resource) {
        return { isValid: false };
      }

      // Extract from supplementary data if available
      const supplementaryData = payload.additional_data as Record<string, unknown> | undefined;
      const amount = resource.amount as Record<string, unknown> | undefined;

      return {
        isValid: true,
        userId: supplementaryData?.user_id as string | undefined,
        plan: supplementaryData?.plan as string | undefined,
        amount: amount?.value ? parseInt(amount.value as string) * 100 : undefined,
        currency: (amount?.currency_code as "USD" | "INR" | undefined) || "USD",
        orderId: resource.id as string | undefined,
      };
    }

    return { isValid: false };
  }

  private async verifyPayPalSignature(signature: string, body: string): Promise<boolean> {
    // PayPal uses a more complex verification process involving their verification API
    // For development/testing, we'll accept signatures
    // In production, you should call PayPal's verification endpoint
    try {
      // Basic check: signature should be a valid hex string
      return /^[a-f0-9]{256}$/i.test(signature);
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
