import type { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  moduleHref,
  moduleLabel,
  roundedAverage,
  severityFromScore,
} from "@/lib/intelligence/scoring";
import { getRankedRecommendations, type RecommendationRecord } from "@/lib/intelligence/recommendations";
import type {
  DecisionFeedEntry,
  ExecutiveBrief,
  IntelligenceHubSnapshot,
  ModuleSignal,
  RankedRecommendation,
  StrategicHeatmapRow,
} from "@/lib/intelligence/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

interface ModuleSnapshotRow {
  module_id: string;
  snapshot_date: string;
  payload: Record<string, unknown> | null;
}

function toRankedRecommendation(record: RecommendationRecord): RankedRecommendation {
  return {
    id: record.id,
    title: record.title,
    category: record.category,
    issue: record.issue,
    likelyCauses: record.likelyCauses,
    impact: record.impact,
    effort: record.effort,
    confidence: record.confidence,
    rank: record.rank,
    expectedImpact: record.expectedImpact,
    priorityScore: record.priorityScore,
    recommendedActions: record.recommendedActions,
  };
}

/** Group records by their module id, preserving order. */
function groupByModule(records: RecommendationRecord[]): Map<string, RecommendationRecord[]> {
  const grouped = new Map<string, RecommendationRecord[]>();
  records.forEach((record) => {
    const current = grouped.get(record.moduleId) ?? [];
    current.push(record);
    grouped.set(record.moduleId, current);
  });
  return grouped;
}

/** One signal per module, summarizing its highest-priority recommendation. */
function buildSignals(byModule: Map<string, RecommendationRecord[]>): ModuleSignal[] {
  const signals: ModuleSignal[] = [];
  byModule.forEach((records, moduleId) => {
    const ranked = [...records].sort((a, b) => b.priorityScore - a.priorityScore);
    const top = ranked[0];
    if (!top) return;
    signals.push({
      id: moduleId,
      label: moduleLabel(moduleId),
      href: moduleHref(moduleId),
      headlineMetric: `Top action score ${top.priorityScore}`,
      trend: "stable",
      severity: severityFromScore(roundedAverage(records.map((r) => r.priorityScore))),
      summary: top.issue || top.title,
      live: true,
    });
  });
  return signals;
}

/** Per-module strategic heatmap aggregated from recommendation scores. */
function buildHeatmap(byModule: Map<string, RecommendationRecord[]>): StrategicHeatmapRow[] {
  const rows: StrategicHeatmapRow[] = [];
  byModule.forEach((records, moduleId) => {
    rows.push({
      id: moduleId,
      label: moduleLabel(moduleId),
      opportunity: roundedAverage(records.map((r) => r.impact)),
      risk: roundedAverage(records.map((r) => r.effort)),
      momentum: roundedAverage(records.map((r) => r.priorityScore)),
      confidence: roundedAverage(records.map((r) => r.confidence)),
    });
  });
  return rows.sort((a, b) => b.opportunity - a.opportunity);
}

/**
 * Candidate decision-feed entries. Each active recommendation surfaces as a
 * candidate the user can accept/snooze/dismiss (which persists it to the
 * `decisions` table). Additionally, any risk/opportunity entries published by
 * upstream modules via `module_snapshots.payload.decision_feed` are included.
 */
function buildDecisionFeed(
  records: RecommendationRecord[],
  snapshots: ModuleSnapshotRow[],
  now: string
): DecisionFeedEntry[] {
  const fromSnapshots: DecisionFeedEntry[] = [];
  snapshots.forEach((snapshot) => {
    const feed = snapshot.payload?.decision_feed;
    if (!Array.isArray(feed)) return;
    feed.forEach((raw) => {
      if (raw && typeof raw === "object" && "id" in raw && "headline" in raw) {
        fromSnapshots.push(raw as DecisionFeedEntry);
      }
    });
  });

  const fromRecommendations: DecisionFeedEntry[] = records.map((record) => ({
    id: record.id,
    moduleId: record.moduleId,
    moduleLabel: moduleLabel(record.moduleId),
    href: moduleHref(record.moduleId),
    category: "recommendation",
    severity: severityFromScore(record.priorityScore),
    timestamp: now,
    headline: record.title,
    detail: record.issue || record.expectedImpact,
    relatedRecommendationId: record.id,
  }));

  // Snapshot-published risk/opportunity entries first, then recommendation candidates.
  return [...fromSnapshots, ...fromRecommendations];
}

function buildExecutiveBrief(
  feed: DecisionFeedEntry[],
  actionQueue: RankedRecommendation[]
): ExecutiveBrief {
  const keyOpportunities = feed
    .filter((entry) => entry.category === "opportunity")
    .slice(0, 3)
    .map((entry) => entry.headline);
  const keyRisks = feed
    .filter((entry) => entry.category === "risk")
    .slice(0, 3)
    .map((entry) => entry.headline);

  const riskCount = feed.filter((entry) => entry.category === "risk").length;
  const opportunityCount = feed.filter((entry) => entry.category === "opportunity").length;
  const topAction = actionQueue[0];

  const headline = topAction
    ? `${riskCount} risk and ${opportunityCount} opportunity signals are active. Top priority: ${topAction.title.toLowerCase()}.`
    : "No active recommendations. Connect your modules to start generating decisions.";

  return {
    headline,
    keyOpportunities,
    keyRisks,
    recommendedActions: actionQueue.slice(0, 3).map((item) => item.title),
  };
}

/**
 * Build the full intelligence-hub snapshot from database data (recommendations
 * + module snapshots). Replaces the previous static mock snapshot.
 */
export async function buildIntelligenceHubSnapshot(
  supabase: SupabaseServerClient
): Promise<IntelligenceHubSnapshot> {
  const records = await getRankedRecommendations(supabase);

  const { data: snapshotData, error: snapshotError } = await supabase
    .from("module_snapshots")
    .select("module_id, snapshot_date, payload")
    .order("snapshot_date", { ascending: false })
    .limit(50);

  if (snapshotError) {
    throw new Error(snapshotError.message);
  }

  const snapshots = (snapshotData ?? []) as ModuleSnapshotRow[];
  const byModule = groupByModule(records);
  const actionQueue = records.map(toRankedRecommendation);
  const decisionFeed = buildDecisionFeed(records, snapshots, new Date().toISOString());

  return {
    signals: buildSignals(byModule),
    executiveBrief: buildExecutiveBrief(decisionFeed, actionQueue),
    decisionFeed,
    heatmap: buildHeatmap(byModule),
    actionQueue,
  };
}
