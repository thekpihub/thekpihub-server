import type { createSupabaseServerClient } from "@/lib/supabase/server";
import { weightedPriorityScore } from "@/lib/intelligence/scoring";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Database-backed recommendation, ranked and with narrative content resolved. */
export interface RecommendationRecord {
  id: string;
  moduleId: string;
  title: string;
  category: string;
  issue: string;
  likelyCauses: string[];
  recommendedActions: string[];
  expectedImpact: string;
  impact: number;
  effort: number;
  confidence: number;
  priorityScore: number;
  rank: number;
}

export interface AccuracySummary {
  success_count: number;
  partial_success_count: number;
  failed_count: number;
  total_scored: number;
  score: number;
}

interface RecommendationRow {
  id: string;
  module_id: string;
  title: string;
  confidence: number | null;
  impact: number | null;
  effort: number | null;
  metadata: Record<string, unknown> | null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Load the recommendation catalog from the database, resolve the narrative
 * content stored in `metadata`, compute a priority score, and rank by it.
 */
export async function getRankedRecommendations(
  supabase: SupabaseServerClient
): Promise<RecommendationRecord[]> {
  const { data, error } = await supabase
    .from("recommendations")
    .select("id, module_id, title, confidence, impact, effort, metadata");

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as RecommendationRow[];

  return rows
    .map((row) => {
      const metadata = row.metadata ?? {};
      const impact = row.impact ?? 0;
      const effort = row.effort ?? 0;
      const confidence = row.confidence ?? 0;
      return {
        id: row.id,
        moduleId: row.module_id,
        title: row.title,
        category: asString(metadata.category, "General"),
        issue: asString(metadata.issue),
        likelyCauses: asStringArray(metadata.likely_causes),
        recommendedActions: asStringArray(metadata.recommended_actions),
        expectedImpact: asString(metadata.expected_impact),
        impact,
        effort,
        confidence,
        priorityScore: weightedPriorityScore({ impact, confidence, effort }),
        rank: 0,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .map((recommendation, index) => ({ ...recommendation, rank: index + 1 }));
}

function summarize(results: Array<"success" | "partial_success" | "failed">): AccuracySummary {
  const summary: AccuracySummary = {
    success_count: 0,
    partial_success_count: 0,
    failed_count: 0,
    total_scored: results.length,
    score: 0,
  };

  results.forEach((result) => {
    if (result === "success") summary.success_count += 1;
    else if (result === "partial_success") summary.partial_success_count += 1;
    else if (result === "failed") summary.failed_count += 1;
  });

  if (summary.total_scored > 0) {
    const weighted = summary.success_count * 1 + summary.partial_success_count * 0.5;
    summary.score = Math.round((weighted / summary.total_scored) * 100);
  }

  return summary;
}

/**
 * Compute per-recommendation accuracy from this user's recorded decision
 * outcomes. Returns a map keyed by recommendation id.
 */
export async function computeAccuracyByRecommendation(
  supabase: SupabaseServerClient,
  userId: string
): Promise<Map<string, AccuracySummary>> {
  const { data, error } = await supabase
    .from("decisions")
    .select("recommendation_id, decision_outcomes(result)")
    .eq("user_id", userId)
    .not("recommendation_id", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const byRecommendation = new Map<string, Array<"success" | "partial_success" | "failed">>();

  ((data ?? []) as Array<{
    recommendation_id: string | null;
    decision_outcomes: Array<{ result: "success" | "partial_success" | "failed" }> | { result: "success" | "partial_success" | "failed" } | null;
  }>).forEach((row) => {
    const recommendationId = row.recommendation_id;
    const outcome = Array.isArray(row.decision_outcomes)
      ? row.decision_outcomes[0]
      : row.decision_outcomes;
    if (!recommendationId || !outcome?.result) return;
    const current = byRecommendation.get(recommendationId) ?? [];
    current.push(outcome.result);
    byRecommendation.set(recommendationId, current);
  });

  const accuracy = new Map<string, AccuracySummary>();
  byRecommendation.forEach((results, recommendationId) => {
    accuracy.set(recommendationId, summarize(results));
  });
  return accuracy;
}

export function emptyAccuracy(): AccuracySummary {
  return summarize([]);
}
