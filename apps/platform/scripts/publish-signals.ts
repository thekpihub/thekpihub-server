/**
 * Scheduled worker: reads KPI data from this project's own Supabase database
 * (public.kpis / kpi_values / kpi_targets) and publishes global decision-feed
 * signals into Supabase module_snapshots. See ../SIGNAL_WIRING_DESIGN_20260713.md
 * for the full design and rationale.
 *
 * Rewritten 2026-09-10 to read directly from Supabase instead of an external
 * "kpihub-backend" HTTP API + JWT — that backend was never deployed, and the
 * KPI data now lives in this same database (see apps/platform's own
 * dashboard/kpi-monitor UI + /api/kpis routes) instead of a separate service.
 * This removes the KPIHUB_API_URL / KPIHUB_SERVICE_JWT env vars entirely.
 *
 * Deliberately standalone (not part of the Next.js app's build/runtime) so
 * it can be run from a GitHub Actions workflow with its own scoped
 * credentials. Requires migration 0004 (kpis/kpi_values/kpi_targets) to be
 * applied before real writes will succeed (dry-run mode still needs read
 * access, since signals are computed from real rows either way).
 *
 * Env vars:
 *   SUPABASE_URL                same as NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_ANON_KEY            same as NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_WORKER_EMAIL       dedicated Supabase Auth user for this worker
 *   SUPABASE_WORKER_PASSWORD    that user's password
 *   DRY_RUN                     "true" to log computed signals without writing (default: true)
 */

import { createClient } from "@supabase/supabase-js";

type Severity = "low" | "medium" | "high";
type Category = "risk" | "opportunity" | "recommendation";

interface DecisionFeedEntry {
  id: string;
  moduleId: string;
  moduleLabel: string;
  href?: string;
  category: Category;
  severity: Severity;
  timestamp: string;
  headline: string;
  detail: string;
  relatedRecommendationId?: string;
}

interface KpiListItem {
  id: string;
  name: string;
  direction: "higher_is_better" | "lower_is_better" | "target_is_better";
  current_value: number | null;
  change_percentage: number | null;
}

interface KpiTarget {
  id: string;
  target_value: number;
  target_date: string;
}

interface KpiTrendPoint {
  value: number;
  change_percentage: number | null;
  period_start: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const DRY_RUN = (process.env.DRY_RUN ?? "true").toLowerCase() !== "false";

function getSupabaseClient() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_ANON_KEY"));
}

async function signInWorker(supabase: ReturnType<typeof getSupabaseClient>): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: requireEnv("SUPABASE_WORKER_EMAIL"),
    password: requireEnv("SUPABASE_WORKER_PASSWORD"),
  });
  if (error) throw new Error(`Supabase sign-in failed: ${error.message}`);
}

/** Rule 1: latest value is on the wrong side of the nearest past-due target. */
function checkMissedTarget(kpi: KpiListItem, targets: KpiTarget[]): DecisionFeedEntry | null {
  if (kpi.current_value === null) return null;
  if (kpi.direction === "target_is_better") return null; // not handled in v1, see design doc

  const today = new Date().toISOString().slice(0, 10);
  const pastDue = targets
    .filter((t) => t.target_date <= today)
    .sort((a, b) => (a.target_date < b.target_date ? 1 : -1))[0]; // most recent past-due
  if (!pastDue) return null;

  const missed =
    kpi.direction === "higher_is_better"
      ? kpi.current_value < pastDue.target_value
      : kpi.current_value > pastDue.target_value;
  if (!missed) return null;

  const gapPercent = Math.abs(
    ((kpi.current_value - pastDue.target_value) / (pastDue.target_value || 1)) * 100
  );
  const severity: Severity = gapPercent >= 20 ? "high" : gapPercent >= 8 ? "medium" : "low";

  return {
    id: `kpi-missed-target-${kpi.id}`,
    moduleId: "kpi-monitor",
    moduleLabel: "KPI Monitor",
    href: "/dashboard/kpi-monitor",
    category: "risk",
    severity,
    timestamp: new Date().toISOString(),
    headline: `${kpi.name} missed its target`,
    detail: `Current value ${kpi.current_value} vs target ${pastDue.target_value} (set for ${pastDue.target_date}).`,
  };
}

/** Rule 2: the most recent trend point reverses direction vs. the one before it. */
function checkTrendReversal(kpi: KpiListItem, trend: KpiTrendPoint[]): DecisionFeedEntry | null {
  if (trend.length < 2) return null;
  if (kpi.direction === "target_is_better") return null;

  const [prev, latest] = trend.slice(-2);
  if (prev.change_percentage === null || latest.change_percentage === null) return null;

  const prevWasGood =
    kpi.direction === "higher_is_better" ? prev.change_percentage >= 0 : prev.change_percentage <= 0;
  const latestIsGood =
    kpi.direction === "higher_is_better" ? latest.change_percentage >= 0 : latest.change_percentage <= 0;

  if (prevWasGood === latestIsGood) return null; // no reversal

  const category: Category = latestIsGood ? "opportunity" : "risk";
  const magnitude = Math.abs(latest.change_percentage);
  const severity: Severity = magnitude >= 25 ? "high" : magnitude >= 10 ? "medium" : "low";

  return {
    id: `kpi-trend-reversal-${kpi.id}-${latest.period_start}`,
    moduleId: "kpi-monitor",
    moduleLabel: "KPI Monitor",
    href: "/dashboard/kpi-monitor",
    category,
    severity,
    timestamp: new Date().toISOString(),
    headline: `${kpi.name} trend reversed to ${category === "opportunity" ? "improving" : "declining"}`,
    detail: `Latest period change ${latest.change_percentage.toFixed(1)}% vs previous ${prev.change_percentage.toFixed(1)}%.`,
  };
}

/** Builds a change_percentage-annotated trend series from ascending-ordered raw values. */
function toTrendPoints(rawValues: { value: number; period_start: string }[]): KpiTrendPoint[] {
  return rawValues.map((point, index) => {
    const prevValue = index > 0 ? rawValues[index - 1].value : null;
    const change_percentage =
      prevValue !== null && prevValue !== 0 ? ((point.value - prevValue) / Math.abs(prevValue)) * 100 : null;
    return { value: point.value, change_percentage, period_start: point.period_start };
  });
}

async function computeSignals(supabase: ReturnType<typeof getSupabaseClient>): Promise<DecisionFeedEntry[]> {
  const { data: kpiRows, error: kpisError } = await supabase
    .from("kpis")
    .select("id, name, direction")
    .eq("status", "active")
    .limit(200);
  if (kpisError) throw new Error(`Failed to read kpis: ${kpisError.message}`);

  const entries: DecisionFeedEntry[] = [];

  for (const kpiRow of kpiRows ?? []) {
    const [{ data: valueRows, error: valuesError }, { data: targetRows, error: targetsError }] = await Promise.all([
      supabase
        .from("kpi_values")
        .select("value, period_start")
        .eq("kpi_id", kpiRow.id)
        .order("period_start", { ascending: true })
        .limit(6),
      supabase
        .from("kpi_targets")
        .select("id, target_value, target_date")
        .eq("kpi_id", kpiRow.id),
    ]);
    if (valuesError) throw new Error(`Failed to read kpi_values for ${kpiRow.id}: ${valuesError.message}`);
    if (targetsError) throw new Error(`Failed to read kpi_targets for ${kpiRow.id}: ${targetsError.message}`);

    const trend = toTrendPoints(valueRows ?? []);
    const latest = trend[trend.length - 1];

    const kpi: KpiListItem = {
      id: kpiRow.id,
      name: kpiRow.name,
      direction: kpiRow.direction,
      current_value: latest?.value ?? null,
      change_percentage: latest?.change_percentage ?? null,
    };

    const missedTarget = checkMissedTarget(kpi, (targetRows ?? []) as KpiTarget[]);
    if (missedTarget) entries.push(missedTarget);

    const trendReversal = checkTrendReversal(kpi, trend);
    if (trendReversal) entries.push(trendReversal);
  }

  return entries;
}

async function publish(supabase: ReturnType<typeof getSupabaseClient>, entries: DecisionFeedEntry[]): Promise<void> {
  const snapshotDate = new Date().toISOString().slice(0, 10);
  const { error: upsertError } = await supabase
    .from("module_snapshots")
    .upsert(
      {
        organization_id: null,
        module_id: "kpi-monitor",
        snapshot_date: snapshotDate,
        payload: { decision_feed: entries },
      },
      { onConflict: "module_id,snapshot_date" }
    );

  if (upsertError) throw new Error(`module_snapshots upsert failed: ${upsertError.message}`);
}

async function main() {
  const supabase = getSupabaseClient();
  await signInWorker(supabase);

  const entries = await computeSignals(supabase);

  if (DRY_RUN) {
    console.log(`[dry-run] computed ${entries.length} signal(s), not writing:`);
    console.log(JSON.stringify(entries, null, 2));
    return;
  }

  await publish(supabase, entries);
  console.log(`Published ${entries.length} signal(s) to module_snapshots.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
