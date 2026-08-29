import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BadRequestError, parseCheckoutRequest, readJsonObject } from "@/lib/api/validation";
import {
  getPaymentProcessor,
  getPrimaryProcessorForRegion,
  getCurrencyForRegion,
  getPriceInSmallestUnit,
  detectUserRegion,
  type PaymentProcessorType,
} from "@/lib/payments";

interface CheckoutRequestWithProcessor extends Record<string, unknown> {
  plan: "growth" | "enterprise";
  processor?: PaymentProcessorType;
  region?: string;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return NextResponse.json(
      { error: "Billing environment is not configured yet" },
      { status: 500 }
    );
  }

  let body: CheckoutRequestWithProcessor;
  try {
    const rawBody = await readJsonObject(request);
    const validated = parseCheckoutRequest(rawBody);
    body = {
      ...validated,
      processor: (rawBody.processor as PaymentProcessorType | undefined) || undefined,
      region: (rawBody.region as string | undefined) || undefined,
    };
  } catch (error) {
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  // Determine region and processor
  const region = detectUserRegion(body.region);
  const processorType =
    body.processor || getPrimaryProcessorForRegion(region);

  try {
    const processor = getPaymentProcessor(processorType);
    const currency = getCurrencyForRegion(region);
    const amount = getPriceInSmallestUnit(body.plan, currency);

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    const email = profile?.email ?? user.email ?? "";

    const checkoutSession = await processor.createCheckout({
      amount,
      planId: body.plan,
      email,
      userId: user.id,
      appUrl,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      clientSecret: checkoutSession.clientSecret,
      processor: processorType,
      currency: checkoutSession.currency,
      amount: checkoutSession.amount,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Payment processor error";
    return NextResponse.json(
      { error: "Checkout session creation failed", details: errorMessage },
      { status: 500 }
    );
  }
}
