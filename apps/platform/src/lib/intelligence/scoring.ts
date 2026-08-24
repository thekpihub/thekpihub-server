import type { ModuleSignal, Severity } from "@/lib/intelligence/types";

// Pure, dependency-free helpers shared by the server intelligence service and
// the client dashboard. No Supabase, no secrets — safe to import anywhere.

const SEVERITY_RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

/**
 * Priority score used to rank recommendations. Weights impact and confidence
 * up and effort down. Kept identical to the original engine formula so scores
 * stay comparable across the migration from mock to database-backed data.
 */
export function weightedPriorityScore(input: {
  impact: number;
  confidence: number;
  effort: number;
}): number {
  return Math.round(
    input.impact * 0.45 + input.confidence * 0.35 + (100 - input.effort) * 0.2
  );
}

/** Map a 0-100 score onto a coarse severity band for signals/feed entries. */
export function severityFromScore(score: number): Severity {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

/** Sort signals by severity (desc) and attach a 1-based rank. */
export function rankSignalsBySeverity(signalsToRank: ModuleSignal[]): ModuleSignal[] {
  return [...signalsToRank]
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
    .map((signal, index) => ({ ...signal, rank: index + 1 }));
}

const MODULE_LABELS: Record<string, string> = {
  "recommendation-engine": "Recommendation Engine",
  "forecasting-center": "Forecasting Center",
  "market-shift": "Market Shift Engine",
  "opportunity-radar": "Opportunity Radar",
  "executive-war-room": "Executive War Room",
  "competitor-dna": "Competitor DNA Explorer",
  "knowledge-graph": "Knowledge Graph Explorer",
  "kpi-monitor": "KPI Monitor",
};

/** Human-readable label for a module id (falls back to Title Case). */
export function moduleLabel(moduleId: string): string {
  return (
    MODULE_LABELS[moduleId] ??
    moduleId
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

/** Dashboard route for a module id. */
export function moduleHref(moduleId: string): string {
  return `/dashboard/${moduleId}`;
}

/** Average of a numeric list, rounded; 0 when empty. */
export function roundedAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
