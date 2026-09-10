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
    .from("kpi_targets")
    .select("id, target_value, target_date, created_at")
    .eq("kpi_id", id)
    .order("target_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ targets: data ?? [] });
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

  let body: { target_value?: unknown; target_date?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const targetValue = typeof body.target_value === "number" ? body.target_value : Number(body.target_value);
  const targetDate = typeof body.target_date === "string" ? body.target_date : "";

  if (!Number.isFinite(targetValue)) {
    return NextResponse.json({ error: "target_value must be a number" }, { status: 400 });
  }
  if (!targetDate) {
    return NextResponse.json({ error: "target_date is required (YYYY-MM-DD)" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("kpi_targets")
    .insert({ kpi_id: id, target_value: targetValue, target_date: targetDate })
    .select("id, target_value, target_date, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ target: data }, { status: 201 });
}
