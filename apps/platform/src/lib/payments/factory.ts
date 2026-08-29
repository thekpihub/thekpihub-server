/**
 * Payment Processor Factory
 * Creates and manages payment processor instances
 */

import type { PaymentProcessor, PaymentProcessorType } from "./types";
import { RazorpayProcessor } from "./RazorpayProcessor";
import { PayPalProcessor } from "./PayPalProcessor";

/**
 * Create a payment processor instance by type
 */
export function createPaymentProcessor(type: PaymentProcessorType): PaymentProcessor {
  switch (type) {
    case "razorpay":
      return new RazorpayProcessor();
    case "paypal":
      return new PayPalProcessor();
    default:
      const _exhaustive: never = type;
      throw new Error(`Unknown payment processor type: ${_exhaustive}`);
  }
}

/**
 * Cached processor instances to avoid re-instantiation
 */
const processorCache = new Map<PaymentProcessorType, PaymentProcessor>();

/**
 * Get or create a cached processor instance
 */
export function getPaymentProcessor(type: PaymentProcessorType): PaymentProcessor {
  let processor = processorCache.get(type);

  if (!processor) {
    processor = createPaymentProcessor(type);
    processorCache.set(type, processor);
  }

  return processor;
}

/**
 * Get processor type for a given checkout session ID
 * In production, this could look up the processor from a database
 */
export function getProcessorFromSessionId(sessionId: string): PaymentProcessorType {
  // Razorpay order IDs start with "order_"
  // PayPal order IDs are longer and alphanumeric
  if (sessionId.startsWith("order_")) {
    return "razorpay";
  }

  // Default to PayPal for other formats
  return "paypal";
}

/**
 * Verify all processor credentials are configured
 */
export function verifyPaymentProcessorsConfigured(): {
  razorpay: boolean;
  paypal: boolean;
} {
  const razorpayConfigured =
    !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;

  const paypalConfigured =
    !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET;

  return {
    razorpay: razorpayConfigured,
    paypal: paypalConfigured,
  };
}
