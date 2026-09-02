import { Router, Request, Response } from "express";
import { requireAuth, type JWTPayload } from "../middleware/auth.js";

const router = Router();

const THEKPIHUB_API_URL =
  process.env.THEKPIHUB_API_URL ?? "https://app.thekpihub.com";
const CONTEXT_BRIDGE_SECRET = process.env.CONTEXT_BRIDGE_SECRET ?? "";

const CACHE_TTL_MS = 5 * 60 * 1000;

export interface KpiContext {
  context: string;
  kpis: unknown[];
  summary: string;
}

interface CacheEntry {
  value: KpiContext;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function fallbackContext(plan: JWTPayload["plan"]): KpiContext {
  const summary = `No KPI data connected. User is on the ${plan} plan.`;
  return {
    context: `${summary} Answer questions about KPI analysis, SaaS metrics, and business intelligence.`,
    kpis: [],
    summary,
  };
}

/**
 * Fetch the user's KPI context from the thekpihub backend, with a 5-minute
 * per-user in-memory cache and graceful fallback when the API is unreachable.
 */
export async function getUserContext(
  userId: string,
  plan: JWTPayload["plan"]
): Promise<KpiContext> {
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let result: KpiContext;
  try {
    const url = `${THEKPIHUB_API_URL}/api/ai/context?userId=${encodeURIComponent(userId)}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${CONTEXT_BRIDGE_SECRET}` },
    });

    if (!resp.ok) throw new Error(`thekpihub context API returned ${resp.status}`);

    const data = (await resp.json()) as Partial<KpiContext> & {
      kpis?: unknown[];
    };
    const kpis = Array.isArray(data.kpis) ? data.kpis : [];
    const summary = data.summary ?? "KPI context loaded.";
    const context =
      data.context ??
      `KPI context for ${plan} plan user.\n${summary}`;

    result = { context, kpis, summary };
  } catch {
    result = fallbackContext(plan);
  }

  cache.set(userId, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

// ── GET /api/context ──────────────────────────────────────────────────────────
// KPI Memory Layer™ — returns the user's business context for AI prompts.

router.get("/context", requireAuth, async (req: Request, res: Response) => {
  const user = (req as Request & { user?: JWTPayload }).user!;
  const ctx = await getUserContext(user.sub, user.plan);
  res.json(ctx);
});

export default router;
