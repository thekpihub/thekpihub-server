/**
 * Payment Processor Types and Interfaces
 * Defines the contract for payment processors (Razorpay, PayPal, etc.)
 */

export type PaymentProcessorType = "razorpay" | "paypal";
export type CurrencyCode = "INR" | "USD";

export interface CheckoutSessionRequest {
  amount: number; // Amount in the smallest currency unit (paisa for INR, cents for USD)
  planId: "growth" | "enterprise";
  email: string;
  userId: string;
  appUrl: string;
}

export interface CheckoutSession {
  id: string;
  url?: string; // Payment URL for client (Razorpay order URL format)
  clientSecret?: string; // For client-side handling (PayPal style)
  currency: CurrencyCode;
  amount: number;
  processor: PaymentProcessorType;
}

export interface WebhookEventData {
  type: string;
  processorEventType: string;
  payload: Record<string, unknown>;
  signature?: string;
  rawBody?: string;
}

export interface PaymentVerification {
  isValid: boolean;
  userId?: string;
  plan?: string;
  amount?: number;
  currency?: CurrencyCode;
  orderId?: string; // Razorpay order ID or PayPal transaction ID
}

export interface PaymentProcessor {
  /**
   * Create a checkout session for payment
   */
  createCheckout(request: CheckoutSessionRequest): Promise<CheckoutSession>;

  /**
   * Verify webhook signature and extract payment data
   */
  handleWebhook(data: WebhookEventData): Promise<PaymentVerification>;

  /**
   * Validate webhook signature
   */
  validateSignature(signature: string, payload: string, secret: string): boolean;

  /**
   * Get processor type identifier
   */
  getProcessorType(): PaymentProcessorType;

  /**
   * Get supported currency for this processor
   */
  getSupportedCurrency(): CurrencyCode;
}
