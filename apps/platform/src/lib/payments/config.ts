/**
 * Payment Processor Configuration
 * Handles region-based processor selection and pricing
 */

import type { PaymentProcessorType } from "./types";

export type RegionCode = "IN" | "US" | "GB" | "CA" | "AU" | "OTHER";

/**
 * Get the primary payment processor for a region
 * India → Razorpay (primary)
 * Other regions → PayPal (primary)
 */
export function getPrimaryProcessorForRegion(region: RegionCode): PaymentProcessorType {
  return region === "IN" ? "razorpay" : "paypal";
}

/**
 * Get the fallback processor if primary fails
 */
export function getFallbackProcessorForRegion(region: RegionCode): PaymentProcessorType {
  return region === "IN" ? "paypal" : "razorpay";
}

/**
 * Pricing configuration by plan and currency
 * Used to calculate checkout amounts
 */
export const PRICING_CONFIG = {
  INR: {
    growth: 4999, // INR in paisa (smallest unit)
    enterprise: 14999,
  },
  USD: {
    growth: 5999, // USD in cents (smallest unit)
    enterprise: 14999,
  },
} as const;

export function getPriceInSmallestUnit(
  plan: "growth" | "enterprise",
  currency: "INR" | "USD"
): number {
  return PRICING_CONFIG[currency][plan];
}

/**
 * Detect user region from country code or IP
 * In production, use GeoIP or user profile settings
 */
export function detectUserRegion(countryCode?: string): RegionCode {
  if (countryCode === "IN") return "IN";
  if (countryCode === "US") return "US";
  if (countryCode === "GB") return "GB";
  if (countryCode === "CA") return "CA";
  if (countryCode === "AU") return "AU";
  return "OTHER";
}

/**
 * Get currency preference for region
 */
export function getCurrencyForRegion(region: RegionCode): "INR" | "USD" {
  return region === "IN" ? "INR" : "USD";
}
