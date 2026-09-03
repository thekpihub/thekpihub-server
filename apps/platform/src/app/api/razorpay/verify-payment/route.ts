/**
 * Razorpay Verify Payment Endpoint
 * POST /api/razorpay/verify-payment
 *
 * Verifies the Razorpay payment signature to ensure payment authenticity,
 * then grants the plan directly. This is the client-driven confirmation
 * path -- it runs the moment checkout.js reports success, so the plan is
 * live immediately without waiting on Razorpay's webhook to be configured
 * and delivered (the webhook at /api/billing/webhook/razorpay still runs
 * too, as an idempotent backup for cases where the browser closes before
 * this request completes).
 *
 * Previously this route only verified the signature and returned a JSON
 * status -- it never touched the database, so nothing granted the plan
 * unless the separate webhook was also correctly configured. Fixed
 * 2026-09-04 alongside the Razorpay webhook-secret bug (see
 * RazorpayProcessor.ts).
 *
 * Request: { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }
 * Response: { verified: true/false }
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay secret not configured" },
        { status: 500 }
      );
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature", "plan"],
        },
        { status: 400 }
      );
    }

    if (!allowedPlans.has(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    const isSignatureValid =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

    if (!isSignatureValid) {
      console.warn("Razorpay signature mismatch:", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      return NextResponse.json(
        { error: "Payment verification failed - invalid signature" },
        { status: 400 }
      );
    }

    // Signature valid and belongs to the logged-in user's own session --
    // grant the plan now rather than waiting on the webhook.
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
        { error: "Payment verified but failed to update plan", details: errorText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      plan,
      message: "Payment verified and plan updated successfully",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Razorpay verify payment error:", errorMessage);

    return NextResponse.json(
      {
        error: "Payment verification failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
