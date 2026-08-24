import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BadRequestError, parseCheckoutRequest, readJsonObject } from "@/lib/api/validation";

const priceEnvByPlan = {
  growth: "STRIPE_PRICE_GROWTH",
  enterprise: "STRIPE_PRICE_ENTERPRISE",
} as const;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!stripeSecretKey || !appUrl) {
    return NextResponse.json(
      { error: "Billing environment is not configured yet" },
      { status: 500 }
    );
  }

  let body;
  try {
    body = parseCheckoutRequest(await readJsonObject(request));
  } catch (error) {
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const priceId = process.env[priceEnvByPlan[body.plan]];

  if (!priceId) {
    return NextResponse.json(
      { error: `${priceEnvByPlan[body.plan]} is not configured` },
      { status: 500 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  const params = new URLSearchParams();
  params.set("ui_mode", "embedded");
  params.set("mode", "subscription");
  params.set("customer_email", profile?.email ?? user.email ?? "");
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("return_url", `${appUrl}/dashboard?checkout_session_id={CHECKOUT_SESSION_ID}`);
  params.set("metadata[user_id]", user.id);
  params.set("metadata[plan]", body.plan);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
    cache: "no-store",
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    return NextResponse.json(
      { error: "Stripe session creation failed", details: data },
      { status: response.status }
    );
  }

  return NextResponse.json({
    clientSecret: data.client_secret,
    sessionId: data.id,
  });
}
