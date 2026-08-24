import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  BadRequestError,
  parseRecordOutcomeRequest,
  readJsonObject,
} from "@/lib/api/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await context.params;
  let body;
  try {
    body = parseRecordOutcomeRequest(await readJsonObject(request));
  } catch (error) {
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const { data: ownedDecision, error: decisionError } = await supabase
    .from("decisions")
    .select("id, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (decisionError || !ownedDecision) {
    return NextResponse.json({ error: "Decision not found" }, { status: 404 });
  }

  if (ownedDecision.status !== "accepted") {
    return NextResponse.json(
      { error: "Only accepted decisions can receive an outcome" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("decision_outcomes")
    .upsert(
      {
        decision_id: id,
        result: body.result,
        notes: body.notes?.trim() || null,
        recorded_at: new Date().toISOString(),
      },
      { onConflict: "decision_id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ outcome: data });
}
