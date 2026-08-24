export type ProfilePlan = "starter" | "growth" | "enterprise";
export type ProfileRole = "executive" | "manager" | "contributor" | "analyst";

export type DecisionStatus = "pending" | "accepted" | "snoozed" | "dismissed";
export type OutcomeResult = "success" | "partial_success" | "failed";

export interface ProfileRecord {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  org: string | null;
  role: ProfileRole | null;
  plan: ProfilePlan;
}

export interface CreateDecisionRequest {
  module_id: string;
  headline: string;
  category: "risk" | "opportunity" | "recommendation";
  severity: "high" | "medium" | "low";
  detail?: string;
  recommendation_id?: string | null;
  source_payload?: Record<string, unknown>;
}

export interface UpdateDecisionStatusRequest {
  status: DecisionStatus;
}

export interface RecordOutcomeRequest {
  result: OutcomeResult;
  notes?: string;
}

export interface CreateCheckoutRequest {
  plan: Exclude<ProfilePlan, "starter">;
}
