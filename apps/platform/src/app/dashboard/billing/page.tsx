import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BillingClient } from "@/components/billing/BillingClient";

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, plan")
    .eq("id", user!.id)
    .single();

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header>
        <div style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: ".8rem" }}>Billing</div>
        <h1 style={{ marginBottom: 8 }}>Plans</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
          Growth is billed monthly via Razorpay (India) or PayPal. Enterprise pricing is custom --
          contact sales instead of checking out.
        </p>
      </header>

      <Suspense fallback={<div className="panel" style={{ padding: 16, color: "var(--muted)" }}>Loading...</div>}>
        <BillingClient currentPlan={profile?.plan ?? "starter"} email={profile?.email ?? user?.email ?? ""} />
      </Suspense>
    </div>
  );
}
