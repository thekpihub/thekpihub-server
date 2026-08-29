/**
 * Razorpay Standard Checkout Component
 * Handles payment flow: create order -> show modal -> verify payment
 */

"use client";

import { useState } from "react";

interface RazorpayCheckoutProps {
  amount: number; // Amount in paise (e.g., 50000 for ₹500)
  currency?: "INR" | "USD";
  description?: string;
  onSuccess?: (paymentId: string, orderId: string) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  buttonClassName?: string;
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export function RazorpayCheckout({
  amount,
  currency = "INR",
  description = "Payment",
  onSuccess,
  onError,
  buttonText = "Pay Now",
  buttonClassName = "px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700",
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate amount
      if (amount < 100) {
        const errorMsg = "Minimum amount is 100 paise (₹1.00)";
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Step 1: Create order from backend
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency,
          receipt: `receipt_${Date.now()}`,
        }),
      });

      if (!orderResponse.ok) {
        const data = await orderResponse.json();
        throw new Error(data.error || "Failed to create order");
      }

      const { order_id } = await orderResponse.json();

      // Step 2: Load Razorpay script and open checkout
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => openCheckout(order_id);
      script.onerror = () => {
        const errorMsg = "Failed to load Razorpay checkout script";
        setError(errorMsg);
        onError?.(errorMsg);
        setLoading(false);
      };
      document.head.appendChild(script);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Payment failed";
      setError(errorMsg);
      onError?.(errorMsg);
      setLoading(false);
    }
  };

  const openCheckout = (orderId: string) => {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!keyId) {
      const errorMsg = "Razorpay Key ID not configured";
      setError(errorMsg);
      onError?.(errorMsg);
      setLoading(false);
      return;
    }

    // Razorpay checkout options
    const options = {
      key: keyId,
      order_id: orderId,
      name: "TheKPIHub",
      description,
      theme: {
        color: "#3399cc",
      },
      handler: async (response: RazorpaySuccessResponse) => {
        await verifyPayment(response);
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
          const errorMsg = "Payment cancelled";
          setError(errorMsg);
          onError?.(errorMsg);
        },
      },
    };

    // Open Razorpay modal
    const Razorpay = (window as any).Razorpay;
    if (Razorpay) {
      const rzp = new Razorpay(options);
      rzp.open();
    }
  };

  const verifyPayment = async (response: RazorpaySuccessResponse) => {
    try {
      // Step 3: Verify payment signature with backend
      const verifyResponse = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || "Signature verification failed");
      }

      // Payment verified successfully
      setError(null);
      setLoading(false);
      onSuccess?.(response.razorpay_payment_id, response.razorpay_order_id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Verification failed";
      setError(errorMsg);
      onError?.(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="razorpay-checkout">
      <button
        onClick={handlePayment}
        disabled={loading}
        className={buttonClassName}
      >
        {loading ? "Processing..." : buttonText}
      </button>
      {error && (
        <div className="mt-2 p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
