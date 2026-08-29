import { NextResponse } from "next/server";
import { RazorpayProcessor } from "@/lib/payments/RazorpayProcessor";

const allowedPlans = new Set(["growth", "enterprise"]);

/**
 * Razorpay Webhook Handler
 * POST /api/billing/webhook/razorpay
 *
 * Expected headers:
 * - x-razorpay-signature: HMAC signature of the webhook payload
 */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Webhook configuration missing" }, { status: 500 });
  }

  const payload = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing x-razorpay-signature header" }, { status: 400 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  try {
    const processor = new RazorpayProcessor();

    const verification = await processor.handleWebhook({
      type: (event.event as string) || "",
      processorEventType: (event.event as string) || "",
      payload: event,
      signature,
      rawBody: payload,
    });

    if (!verification.isValid) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    if (!verification.userId || !verification.plan) {
      return NextResponse.json(
        { error: "Missing user_id or plan in webhook data" },
        { status: 400 }
      );
    }

    if (!allowedPlans.has(verification.plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

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
        body: JSON.stringify({ plan: verification.plan }),
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
    console.error("Razorpay webhook error:", errorMessage);
    return NextResponse.json({ error: "Webhook processing failed", details: errorMessage }, { status: 500 });
  }
}
