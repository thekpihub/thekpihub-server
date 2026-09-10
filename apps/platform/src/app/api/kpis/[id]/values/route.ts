import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("kpi_values")
    .select("id, value, period_start, recorded_at")
    .eq("kpi_id", id)
    .order("period_start", { ascending: false })
    .limit(24);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ values: data ?? [] });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { value?: unknown; period_start?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const value = typeof body.value === "number" ? body.value : Number(body.value);
  if (!Number.isFinite(value)) {
    return NextResponse.json({ error: "value must be a number" }, { status: 400 });
  }
  const periodStart = typeof body.period_start === "string" && body.period_start
    ? body.period_start
    : new Date().toISOString().slice(0, 10);

  // RLS (kpi_values_manage_own) rejects this insert outright if `id` isn't a KPI the caller
  // owns, so no separate ownership check is needed here.
  const { data, error } = await supabase
    .from("kpi_values")
    .upsert({ kpi_id: id, value, period_start: periodStart }, { onConflict: "kpi_id,period_start" })
    .select("id, value, period_start, recorded_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ value: data }, { status: 201 });
}
