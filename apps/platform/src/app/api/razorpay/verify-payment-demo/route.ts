/**
 * Signature-only verification for /razorpay-demo (the standalone sandbox
 * test page, unauthenticated, not part of the real billing flow). Split
 * out 2026-09-04 when /api/razorpay/verify-payment was changed to require
 * an authenticated session + a plan and to grant that plan directly --
 * this keeps the demo page's old "just check the signature" behavior
 * working without weakening the real route's new requirements.
 *
 * Request: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Response: { verified: true/false }
 */

import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay secret not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"],
        },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Payment verification failed - invalid signature" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      message: "Payment verified successfully (demo -- no plan was granted)",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Payment verification failed", details: errorMessage }, { status: 500 });
  }
}
