import { NextResponse } from "next/server";
import { PayPalProcessor } from "@/lib/payments/PayPalProcessor";

const allowedPlans = new Set(["growth", "enterprise"]);

/**
 * PayPal Webhook Handler
 * POST /api/billing/webhook/paypal
 *
 * Expected headers:
 * - paypal-transmission-id: Unique transmission ID
 * - paypal-transmission-sig: HMAC signature
 * - paypal-transmission-time: ISO 8601 timestamp
 * - paypal-cert-url: URL to PayPal's certificate
 */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Webhook configuration missing" }, { status: 500 });
  }

  const payload = await request.text();
  const transmissionId = request.headers.get("paypal-transmission-id");
  const transmissionSig = request.headers.get("paypal-transmission-sig");
  const transmissionTime = request.headers.get("paypal-transmission-time");
  const certUrl = request.headers.get("paypal-cert-url");

  if (!transmissionId || !transmissionSig || !transmissionTime) {
    return NextResponse.json(
      { error: "Missing PayPal webhook headers (transmission-id, transmission-sig, transmission-time)" },
      { status: 400 }
    );
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  try {
    const processor = new PayPalProcessor();
    const eventType = (event.event_type as string) || "";

    const verification = await processor.handleWebhook({
      type: eventType,
      processorEventType: eventType,
      payload: event,
      signature: transmissionSig,
      rawBody: payload,
    });

    if (!verification.isValid) {
      return NextResponse.json({ error: "Invalid webhook signature or verification failed" }, { status: 401 });
    }

    if (!verification.userId) {
      return NextResponse.json(
        { error: "Missing user_id in webhook data" },
        { status: 400 }
      );
    }

    // For PayPal webhooks, we may not always have plan info (depends on webhook event type)
    // Default to "growth" tier if not explicitly provided
    const plan = verification.plan || "growth";

    if (!allowedPlans.has(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Optionally log the payment details for audit purposes
    console.log("PayPal payment verified:", {
      userId: verification.userId,
      orderId: verification.orderId,
      amount: verification.amount,
      currency: verification.currency,
      plan,
      timestamp: new Date().toISOString(),
    });

    // Update user profile with new plan
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(verification.userId)}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({ plan }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to update plan in profiles table:", errorText);
      return NextResponse.json(
        { error: "Failed to update plan", details: errorText },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("PayPal webhook error:", errorMessage);
    return NextResponse.json(
      { error: "Webhook processing failed", details: errorMessage },
      { status: 500 }
    );
  }
}
