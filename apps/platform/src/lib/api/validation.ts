import type {
  CreateCheckoutRequest,
  CreateDecisionRequest,
  DecisionStatus,
  OutcomeResult,
  ProfileRole,
  UpdateDecisionStatusRequest,
} from "@/lib/api/contracts";

const decisionStatuses = new Set<DecisionStatus>(["pending", "accepted", "snoozed", "dismissed"]);
const outcomeResults = new Set<OutcomeResult>(["success", "partial_success", "failed"]);
const profileRoles = new Set<ProfileRole>(["executive", "manager", "contributor", "analyst"]);
const decisionCategories = new Set<CreateDecisionRequest["category"]>([
  "risk",
  "opportunity",
  "recommendation",
]);
const decisionSeverities = new Set<CreateDecisionRequest["severity"]>(["high", "medium", "low"]);
const paidPlans = new Set<CreateCheckoutRequest["plan"]>(["growth", "enterprise"]);

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new BadRequestError("Request body must be a JSON object");
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof BadRequestError) throw error;
    throw new BadRequestError("Invalid JSON request body");
  }
}

function optionalString(value: unknown, field: string) {
  if (value == null) return undefined;
  if (typeof value !== "string") throw new BadRequestError(`${field} must be a string`);
  return value;
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestError(`${field} is required`);
  }
  return value.trim();
}

export function parseCreateDecisionRequest(body: Record<string, unknown>): CreateDecisionRequest {
  const moduleId = requiredString(body.module_id, "module_id");
  const headline = requiredString(body.headline, "headline");
  const detail = optionalString(body.detail, "detail");
  const recommendationId = optionalString(body.recommendation_id, "recommendation_id") ?? null;

  if (!decisionCategories.has(body.category as CreateDecisionRequest["category"])) {
    throw new BadRequestError("category must be risk, opportunity, or recommendation");
  }

  if (!decisionSeverities.has(body.severity as CreateDecisionRequest["severity"])) {
    throw new BadRequestError("severity must be high, medium, or low");
  }

  if (
    body.source_payload != null &&
    (typeof body.source_payload !== "object" || Array.isArray(body.source_payload))
  ) {
    throw new BadRequestError("source_payload must be a JSON object");
  }

  return {
    module_id: moduleId,
    headline,
    category: body.category as CreateDecisionRequest["category"],
    severity: body.severity as CreateDecisionRequest["severity"],
    detail,
    recommendation_id: recommendationId,
    source_payload: (body.source_payload as Record<string, unknown> | undefined) ?? {},
  };
}

export function parseUpdateDecisionStatusRequest(
  body: Record<string, unknown>
): UpdateDecisionStatusRequest {
  if (!decisionStatuses.has(body.status as DecisionStatus)) {
    throw new BadRequestError("status must be pending, accepted, snoozed, or dismissed");
  }
  return { status: body.status as DecisionStatus };
}

export function parseRecordOutcomeRequest(body: Record<string, unknown>) {
  if (!outcomeResults.has(body.result as OutcomeResult)) {
    throw new BadRequestError("result must be success, partial_success, or failed");
  }

  return {
    result: body.result as OutcomeResult,
    notes: optionalString(body.notes, "notes"),
  };
}

export function parseCheckoutRequest(body: Record<string, unknown>): CreateCheckoutRequest {
  if (!paidPlans.has(body.plan as CreateCheckoutRequest["plan"])) {
    throw new BadRequestError("plan must be growth or enterprise");
  }
  return { plan: body.plan as CreateCheckoutRequest["plan"] };
}

export function parseProfilePatchRequest(body: Record<string, unknown>) {
  const role = optionalString(body.role, "role");

  if (role && !profileRoles.has(role as ProfileRole)) {
    throw new BadRequestError("role must be executive, manager, contributor, or analyst");
  }

  return {
    first_name: optionalString(body.first_name, "first_name")?.trim() || null,
    last_name: optionalString(body.last_name, "last_name")?.trim() || null,
    org: optionalString(body.org, "org")?.trim() || null,
    role: role ? (role as ProfileRole) : null,
  };
}
