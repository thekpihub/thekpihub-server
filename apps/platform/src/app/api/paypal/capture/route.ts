/**
 * PayPal Capture Order Endpoint
 * POST /api/paypal/capture
 *
 * The step that was previously missing entirely: after the buyer approves
 * the order on PayPal and is redirected back, this actually captures
 * (charges) it, then grants the plan directly -- mirroring the
 * client-driven confirmation path added to /api/razorpay/verify-payment.
 * The webhook at /api/billing/webhook/paypal still runs too, as an
 * idempotent backup.
 *
 * Request: { orderId }  (the PayPal order ID, read from the `token` query
 *           param PayPal appends to the return_url on redirect)
 * Response: { captured: true, plan }
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PayPalProcessor } from "@/lib/payments/PayPalProcessor";

const allowedPlans = new Set(["growth"]);

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Billing environment is not fully configured yet (missing SUPABASE_SERVICE_ROLE_KEY)" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { orderId } = body;
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const processor = new PayPalProcessor();
    const result = await processor.captureOrder(orderId);

    if (result.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Order not completed", status: result.status },
        { status: 400 }
      );
    }

    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
    const customId = capture?.custom_id || result.purchase_units?.[0]?.custom_id;
    const [capturedUserId, plan] = (customId || "").split(":");

    if (!capturedUserId || capturedUserId !== user.id) {
      // Either the order was never tagged with a user (shouldn't happen --
      // createCheckout always sets custom_id), or someone is trying to
      // capture an order that isn't theirs. Either way, refuse to grant.
      console.error("PayPal capture: custom_id user mismatch", {
        orderId,
        capturedUserId,
        sessionUserId: user.id,
      });
      return NextResponse.json(
        { error: "Order does not belong to the current session" },
        { status: 403 }
      );
    }

    if (!plan || !allowedPlans.has(plan)) {
      return NextResponse.json({ error: "Invalid plan on captured order" }, { status: 400 });
    }

    const patchResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`,
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

    if (!patchResponse.ok) {
      const errorText = await patchResponse.text();
      console.error("Failed to update plan in profiles table:", errorText);
      return NextResponse.json(
        { error: "Order captured but failed to update plan", details: errorText },
        { status: 500 }
      );
    }

    return NextResponse.json({ captured: true, plan, orderId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("PayPal capture error:", errorMessage);
    return NextResponse.json(
      { error: "Order capture failed", details: errorMessage },
      { status: 500 }
    );
  }
}
