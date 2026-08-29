/**
 * Razorpay Verify Payment Endpoint
 * POST /api/razorpay/verify-payment
 *
 * Verifies the Razorpay payment signature to ensure payment authenticity
 * Request: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Response: { verified: true/false }
 */

import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    // Validate environment variables
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay secret not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // Validate request body
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"],
        },
        { status: 400 }
      );
    }

    // Generate signature using HMAC-SHA256
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    // Compare signatures using timing-safe comparison
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );

    if (!isSignatureValid) {
      console.warn("Razorpay signature mismatch:", {
        expected: expectedSignature,
        received: razorpay_signature,
      });

      return NextResponse.json(
        { error: "Payment verification failed - invalid signature" },
        { status: 400 }
      );
    }

    // Signature is valid - payment verified
    return NextResponse.json({
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      message: "Payment verified successfully",
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
