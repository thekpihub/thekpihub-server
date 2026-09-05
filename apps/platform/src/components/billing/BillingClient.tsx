"use client";

/**
 * Growth/Enterprise subscribe UI. Talks to /api/billing/checkout (region-
 * agnostic here -- processor is chosen explicitly by which button the user
 * clicks, not silently auto-detected, since detectUserRegion()/
 * getCurrencyFromAmount() are unreliable -- see PayPalProcessor's
 * getCurrencyFromAmount(), which is hardcoded to USD regardless of the
 * buyer's actual region).
 *
 * Razorpay: opens the checkout.js modal, then POSTs the result to
 * /api/razorpay/verify-payment which verifies the signature and grants
 * the plan directly.
 *
 * PayPal: redirects to the PayPal-hosted approval page. PayPal appends
 * `token` (the order ID) to the return_url on redirect back here; on
 * mount, if that param is present, this component POSTs it to
 * /api/paypal/capture, which actually charges the order and grants the
 * plan (previously nothing in the codebase called PayPal's capture step
 * at all).
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay checkout script")));
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.head.appendChild(script);
  });
}

interface BillingClientProps {
  currentPlan: string;
  email: string;
}

export function BillingClient({ currentPlan, email }: BillingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"idle" | "razorpay" | "paypal" | "capturing">("idle");
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  // Handle the PayPal return redirect: capture the order and grant the plan.
  useEffect(() => {
    const returned = searchParams.get("paypal_return");
    const orderId = searchParams.get("token");
    const cancelled = searchParams.get("paypal_cancelled");

    if (cancelled) {
      setMessage({ kind: "error", text: "PayPal checkout was cancelled." });
      router.replace("/dashboard/billing");
      return;
    }

    if (returned && orderId) {
      setStatus("capturing");
      fetch("/api/paypal/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Capture failed");
          setMessage({ kind: "success", text: `Payment captured -- you're now on the ${data.plan} plan.` });
          router.refresh();
        })
        .catch((err) => {
          setMessage({ kind: "error", text: err instanceof Error ? err.message : "PayPal capture failed" });
        })
        .finally(() => {
          setStatus("idle");
          router.replace("/dashboard/billing");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCheckout(processor: "razorpay" | "paypal", plan: "growth") {
    setMessage(null);
    setStatus(processor);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, processor }),
      });
      const session = await res.json();
      if (!res.ok) throw new Error(session.error || "Failed to start checkout");

      if (processor === "paypal") {
        if (!session.url) throw new Error("PayPal did not return an approval link");
        window.location.href = session.url;
        return;
      }

      // Razorpay: open the checkout.js modal using the real order id.
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) throw new Error("Razorpay is not configured (NEXT_PUBLIC_RAZORPAY_KEY_ID missing)");

      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error("Razorpay checkout script did not load");

      const rzp = new window.Razorpay({
        key: keyId,
        order_id: session.sessionId,
        name: "The KPI Hub",
        description: "Growth plan -- monthly subscription",
        theme: { color: "#e9a123" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, plan }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");
            setMessage({ kind: "success", text: "Payment verified -- you're now on the Growth plan." });
            router.refresh();
          } catch (err) {
            setMessage({ kind: "error", text: err instanceof Error ? err.message : "Verification failed" });
          } finally {
            setStatus("idle");
          }
        },
        modal: {
          ondismiss: () => {
            setStatus("idle");
          },
        },
      });
      rzp.open();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Checkout failed" });
      setStatus("idle");
    }
  }

  const isGrowth = currentPlan === "growth";
  const busy = status !== "idle";

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {message && (
        <div
          className="panel"
          style={{
            padding: 16,
            borderColor: message.kind === "error" ? "var(--danger)" : "var(--teal)",
            color: message.kind === "error" ? "var(--danger)" : "var(--teal)",
          }}
        >
          {message.text}
        </div>
      )}

      {status === "capturing" && (
        <div className="panel" style={{ padding: 16, color: "var(--muted)" }}>
          Finishing your PayPal payment...
        </div>
      )}

      <div className="stats-grid">
        <div className="panel" style={{ padding: 24, display: "grid", gap: 14 }}>
          <div>
            <div style={{ color: "var(--muted)", fontSize: ".82rem", textTransform: "uppercase" }}>Growth</div>
            <div style={{ marginTop: 6, fontSize: "1.8rem", fontWeight: 800 }}>
              ₹5,999<span style={{ fontSize: "1rem", color: "var(--muted)", fontWeight: 500 }}>/mo</span>
            </div>
          </div>
          {isGrowth ? (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                background: "var(--gold-soft)",
                color: "#ffe1ad",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Current plan
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <button
                onClick={() => startCheckout("razorpay", "growth")}
                disabled={busy}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(233, 161, 35, 0.35)",
                  background: "var(--gold)",
                  color: "#1a1200",
                  fontWeight: 700,
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                {status === "razorpay" ? "Opening Razorpay..." : "Pay with Razorpay (INR)"}
              </button>
              <button
                onClick={() => startCheckout("paypal", "growth")}
                disabled={busy}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  fontWeight: 700,
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                {status === "paypal" ? "Redirecting to PayPal..." : "Pay with PayPal (USD)"}
              </button>
            </div>
          )}
        </div>

        <div className="panel" style={{ padding: 24, display: "grid", gap: 14 }}>
          <div>
            <div style={{ color: "var(--muted)", fontSize: ".82rem", textTransform: "uppercase" }}>Enterprise</div>
            <div style={{ marginTop: 6, fontSize: "1.8rem", fontWeight: 800 }}>Custom</div>
          </div>
          <a
            href={`mailto:info@thekpihub.com?subject=${encodeURIComponent(
              "Enterprise plan"
            )}&body=${encodeURIComponent(`Hi, I'd like to talk about the Enterprise plan.\n\nAccount email: ${email}`)}`}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--text)",
              fontWeight: 700,
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Contact sales
          </a>
        </div>
      </div>
    </div>
  );
}
