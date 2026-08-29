import { NextResponse } from "next/server";
import { RazorpayProcessor } from "@/lib/payments/RazorpayProcessor";
import { PayPalProcessor } from "@/lib/payments/PayPalProcessor";

const allowedPlans = new Set(["growth", "enterprise"]);

/**
 * Generic webhook handler that dispatches to appropriate processor
 * Supports both Razorpay and PayPal webhooks
 */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Webhook configuration missing" }, { status: 500 });
  }

  const payload = await request.text();
  const contentType = request.headers.get("content-type") || "";

  let event;
  try {
    event = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  // Determine processor type from webhook signature header or content
  const razorpaySignature = request.headers.get("x-razorpay-signature");
  const paypalTransmissionId = request.headers.get("paypal-transmission-id");

  if (razorpaySignature) {
    return handleRazorpayWebhook(event, payload, razorpaySignature, supabaseUrl, serviceRoleKey);
  } else if (paypalTransmissionId) {
    const paypalCertUrl = request.headers.get("paypal-cert-url");
    const paypalTransmissionSig = request.headers.get("paypal-transmission-sig");
    const paypalTransmissionTime = request.headers.get("paypal-transmission-time");

    return handlePayPalWebhook(
      event,
      payload,
      paypalTransmissionId,
      paypalCertUrl,
      paypalTransmissionSig,
      paypalTransmissionTime,
      supabaseUrl,
      serviceRoleKey
    );
  }

  return NextResponse.json({ error: "Unknown webhook processor" }, { status: 400 });
}

async function handleRazorpayWebhook(
  event: Record<string, unknown>,
  payload: string,
  signature: string,
  supabaseUrl: string,
  serviceRoleKey: string
) {
  try {
    const processor = new RazorpayProcessor();

    const verification = await processor.handleWebhook({
      type: event.event as string,
      processorEventType: event.event as string,
      payload: event,
      signature,
      rawBody: payload,
    });

    if (!verification.isValid || !verification.userId || !verification.plan) {
      return NextResponse.json(
        { error: "Invalid webhook signature or data" },
        { status: 401 }
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
      console.error("Failed to update plan in profiles table:", await response.text());
      return NextResponse.json(
        { error: "Failed to update plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handlePayPalWebhook(
  event: Record<string, unknown>,
  payload: string,
  transmissionId: string,
  certUrl: string | null,
  transmissionSig: string | null,
  transmissionTime: string | null,
  supabaseUrl: string,
  serviceRoleKey: string
) {
  try {
    const processor = new PayPalProcessor();
    const eventType = event.event_type as string | undefined;

    const verification = await processor.handleWebhook({
      type: eventType || "",
      processorEventType: eventType || "",
      payload: event,
      signature: transmissionSig || undefined,
      rawBody: payload,
    });

    if (!verification.isValid || !verification.userId) {
      return NextResponse.json(
        { error: "Invalid webhook signature or data" },
        { status: 401 }
      );
    }

    // For PayPal, we may need to store additional order information
    // or fetch plan from order metadata
    const plan = verification.plan || "growth"; // Default if not provided

    if (!allowedPlans.has(plan)) {
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
        body: JSON.stringify({ plan }),
      }
    );

    if (!response.ok) {
      console.error("Failed to update plan in profiles table:", await response.text());
      return NextResponse.json(
        { error: "Failed to update plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
