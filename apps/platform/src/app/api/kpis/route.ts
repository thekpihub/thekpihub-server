import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface KpiRow {
  id: string;
  name: string;
  unit: string | null;
  direction: "higher_is_better" | "lower_is_better" | "target_is_better";
  status: "active" | "archived";
  created_at: string;
}

interface KpiValueRow {
  kpi_id: string;
  value: number;
  period_start: string;
}

const DIRECTIONS = new Set(["higher_is_better", "lower_is_better", "target_is_better"]);

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: kpis, error: kpisError } = await supabase
    .from("kpis")
    .select("id, name, unit, direction, status, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (kpisError) {
    return NextResponse.json({ error: kpisError.message }, { status: 400 });
  }

  const kpiRows = (kpis ?? []) as KpiRow[];
  const kpiIds = kpiRows.map((k) => k.id);

  // Latest two values per KPI, used to compute a current value + change%. RLS already scopes
  // this to the caller's own KPIs, so no additional filtering is needed here.
  const { data: values, error: valuesError } = kpiIds.length
    ? await supabase
        .from("kpi_values")
        .select("kpi_id, value, period_start")
        .in("kpi_id", kpiIds)
        .order("period_start", { ascending: false })
    : { data: [] as KpiValueRow[], error: null };

  if (valuesError) {
    return NextResponse.json({ error: valuesError.message }, { status: 400 });
  }

  const valuesByKpi = new Map<string, KpiValueRow[]>();
  (values ?? []).forEach((row) => {
    const list = valuesByKpi.get(row.kpi_id) ?? [];
    list.push(row);
    valuesByKpi.set(row.kpi_id, list);
  });

  const enriched = kpiRows.map((kpi) => {
    const recent = valuesByKpi.get(kpi.id) ?? [];
    const current = recent[0]?.value ?? null;
    const previous = recent[1]?.value ?? null;
    const changePercentage =
      current !== null && previous !== null && previous !== 0
        ? ((current - previous) / Math.abs(previous)) * 100
        : null;

    return {
      ...kpi,
      current_value: current,
      change_percentage: changePercentage,
      value_count: recent.length,
    };
  });

  return NextResponse.json({ kpis: enriched });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { name?: unknown; unit?: unknown; direction?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const unit = typeof body.unit === "string" && body.unit.trim() ? body.unit.trim() : null;
  const direction = typeof body.direction === "string" ? body.direction : "higher_is_better";

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!DIRECTIONS.has(direction)) {
    return NextResponse.json({ error: "direction must be higher_is_better, lower_is_better, or target_is_better" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("kpis")
    .insert({ user_id: user.id, name, unit, direction })
    .select("id, name, unit, direction, status, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ kpi: data }, { status: 201 });
}
