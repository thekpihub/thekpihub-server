export type Severity = "low" | "medium" | "high";
export type TrendDirection = "accelerating" | "stable" | "declining";
export type DecisionFeedCategory = "risk" | "opportunity" | "recommendation";

export interface ModuleSignal {
  id: string;
  label: string;
  href: string;
  headlineMetric: string;
  trend: TrendDirection;
  severity: Severity;
  summary: string;
  live?: boolean;
}

export interface DecisionFeedEntry {
  id: string;
  moduleId: string;
  moduleLabel: string;
  href?: string;
  category: DecisionFeedCategory;
  severity: Severity;
  timestamp: string;
  headline: string;
  detail: string;
  relatedRecommendationId?: string;
}

export interface StrategicHeatmapRow {
  id: string;
  label: string;
  opportunity: number;
  risk: number;
  momentum: number;
  confidence: number;
}

export interface RankedRecommendation {
  id: string;
  title: string;
  category?: string;
  issue: string;
  likelyCauses?: string[];
  impact: number;
  effort: number;
  confidence: number;
  rank: number;
  expectedImpact: string;
  priorityScore: number;
  recommendedActions: string[];
}

export interface ExecutiveBrief {
  headline: string;
  keyOpportunities: string[];
  keyRisks: string[];
  recommendedActions: string[];
}

export interface IntelligenceHubSnapshot {
  signals: ModuleSignal[];
  executiveBrief: ExecutiveBrief;
  decisionFeed: DecisionFeedEntry[];
  heatmap: StrategicHeatmapRow[];
  actionQueue: RankedRecommendation[];
}
