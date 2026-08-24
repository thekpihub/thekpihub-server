import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  BadRequestError,
  parseCreateDecisionRequest,
  readJsonObject,
} from "@/lib/api/validation";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("decisions")
    .select("*, decision_outcomes(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ decisions: data });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body;
  try {
    body = parseCreateDecisionRequest(await readJsonObject(request));
  } catch (error) {
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const { data, error } = await supabase
    .from("decisions")
    .insert({
      user_id: user.id,
      module_id: body.module_id,
      headline: body.headline,
      category: body.category,
      severity: body.severity,
      detail: body.detail ?? null,
      recommendation_id: body.recommendation_id ?? null,
      source_payload: body.source_payload ?? {},
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ decision: data }, { status: 201 });
}
