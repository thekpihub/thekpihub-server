/**
 * Payment Processing Module
 * Exports payment processor types, implementations, and utilities
 */

export type { PaymentProcessor, CheckoutSession, CheckoutSessionRequest, WebhookEventData, PaymentVerification, PaymentProcessorType, CurrencyCode } from "./types";

export { RazorpayProcessor } from "./RazorpayProcessor";
export { PayPalProcessor } from "./PayPalProcessor";

export {
  createPaymentProcessor,
  getPaymentProcessor,
  getProcessorFromSessionId,
  verifyPaymentProcessorsConfigured,
} from "./factory";

export {
  getPrimaryProcessorForRegion,
  getFallbackProcessorForRegion,
  getPriceInSmallestUnit,
  detectUserRegion,
  getCurrencyForRegion,
  PRICING_CONFIG,
} from "./config";

export type { RegionCode } from "./config";
