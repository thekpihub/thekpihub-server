/**
 * Razorpay Create Order Endpoint
 * POST /api/razorpay/create-order
 *
 * Creates a Razorpay order for the payment process
 * Request: { amount (paise), currency, receipt }
 * Response: { order_id, amount, currency }
 */

import { NextResponse } from "next/server";
import Razorpay from "razorpay";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function POST(request: Request) {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay credentials not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount, currency = "INR", receipt } = body;

    // Validate request body
    if (!amount || typeof amount !== "number") {
      return NextResponse.json(
        { error: "Amount is required and must be a number" },
        { status: 400 }
      );
    }

    if (amount < 100) {
      return NextResponse.json(
        { error: "Minimum amount is 100 paise (₹1.00)" },
        { status: 400 }
      );
    }

    if (!["INR", "USD"].includes(currency)) {
      return NextResponse.json(
        { error: "Currency must be INR or USD" },
        { status: 400 }
      );
    }

    // Create order with Razorpay API
    const orderData = {
      amount, // Amount in paise (for INR)
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
    };

    const order = await razorpay.orders.create(orderData);

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Razorpay create order error:", errorMessage);

    return NextResponse.json(
      {
        error: "Failed to create order",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
