/**
 * Razorpay Integration Demo Page
 * Test endpoint: http://localhost:3000/razorpay-demo
 */

"use client";

import { useState } from "react";
import { RazorpayCheckout } from "@/components/razorpay/RazorpayCheckout";

export default function RazorpayDemoPage() {
  const [selectedAmount, setSelectedAmount] = useState(50000); // ₹500 in paise
  const [paymentStatus, setPaymentStatus] = useState<{
    status: "idle" | "success" | "error";
    message?: string;
    paymentId?: string;
    orderId?: string;
  }>({ status: "idle" });

  const predefinedAmounts = [
    { label: "₹100", value: 10000 },
    { label: "₹500", value: 50000 },
    { label: "₹1,000", value: 100000 },
    { label: "₹5,000", value: 500000 },
  ];

  const handlePaymentSuccess = (paymentId: string, orderId: string) => {
    setPaymentStatus({
      status: "success",
      message: "✅ Payment verified successfully!",
      paymentId,
      orderId,
    });
  };

  const handlePaymentError = (error: string) => {
    setPaymentStatus({
      status: "error",
      message: `❌ ${error}`,
    });
  };

  const amount = `₹${(selectedAmount / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Razorpay Demo</h1>
        <p className="text-center text-gray-600 mb-8">
          Test the Razorpay Standard Checkout integration
        </p>

        {/* Amount Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Select Amount:
          </label>

          {/* Predefined amounts */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {predefinedAmounts.map((item) => (
              <button
                key={item.value}
                onClick={() => setSelectedAmount(item.value)}
                className={`py-2 px-3 rounded font-medium transition ${
                  selectedAmount === item.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <input
            type="number"
            value={selectedAmount / 100}
            onChange={(e) => setSelectedAmount(Math.max(1, parseFloat(e.target.value)) * 100)}
            min="1"
            step="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter custom amount"
          />

          <p className="text-center text-lg font-bold text-gray-800 mt-4">{amount}</p>
        </div>

        {/* Payment Component */}
        <RazorpayCheckout
          amount={selectedAmount}
          currency="INR"
          description={`Test payment for ${amount}`}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          buttonText={`Pay ${amount}`}
          buttonClassName="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50"
        />

        {/* Status Messages */}
        {paymentStatus.status !== "idle" && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              paymentStatus.status === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <p
              className={`font-medium ${
                paymentStatus.status === "success"
                  ? "text-green-800"
                  : "text-red-800"
              }`}
            >
              {paymentStatus.message}
            </p>

            {paymentStatus.paymentId && (
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-gray-700">
                  <span className="font-semibold">Payment ID:</span>
                  <br />
                  <code className="bg-gray-100 px-2 py-1 rounded break-all">
                    {paymentStatus.paymentId}
                  </code>
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Order ID:</span>
                  <br />
                  <code className="bg-gray-100 px-2 py-1 rounded break-all">
                    {paymentStatus.orderId}
                  </code>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Test Credentials Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Test Card Details:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              <strong>Card Number:</strong> 4111 1111 1111 1111
            </li>
            <li>
              <strong>Expiry:</strong> Any future date
            </li>
            <li>
              <strong>CVV:</strong> Any 3 digits
            </li>
            <li>
              <strong>Name:</strong> Any name
            </li>
            <li>
              <strong>Mode:</strong> Test (Sandbox)
            </li>
          </ul>
        </div>

        {/* Integration Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Integration:</h3>
          <p className="text-xs text-gray-600">
            This demo uses Razorpay Standard Checkout with:
          </p>
          <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
            <li>
              <code className="bg-white px-1">POST /api/razorpay/create-order</code>
            </li>
            <li>
              <code className="bg-white px-1">POST /api/razorpay/verify-payment</code>
            </li>
            <li>Frontend signature verification</li>
            <li>HMAC-SHA256 validation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
