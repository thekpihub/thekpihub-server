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
 *
 * Enterprise is intentionally absent: it's Custom/contact-sales pricing
 * (see pricing.html, the homepage, and apps/platform's own /dashboard/billing
 * page), not a fixed self-serve price. The old placeholder numbers here
 * (previously 14999 for both currencies) were never real and were never
 * wired to a checkout button -- corrected 2026-09-03 per the user rather
 * than left as a number nothing actually validated. getPriceInSmallestUnit()
 * only accepts "growth" now; the checkout route rejects "enterprise"
 * explicitly instead of silently charging a placeholder amount.
 *
 * Growth INR corrected 2026-09-03 to match the published price (₹5,999/mo,
 * see pricing.html / the homepage) -- it previously held 4999 paisa
 * (₹49.99/mo), an order-of-magnitude-off placeholder that was never the
 * intended price. USD growth (5999 cents = $59.99) is unreviewed -- flagged,
 * not touched, since only the INR figure was confirmed.
 */
export const PRICING_CONFIG = {
  INR: {
    growth: 599900, // ₹5,999.00 in paisa (smallest unit)
  },
  USD: {
    growth: 5999, // USD in cents (smallest unit) -- NOT reviewed, carried over as-is
  },
} as const;

export function getPriceInSmallestUnit(plan: "growth", currency: "INR" | "USD"): number {
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
