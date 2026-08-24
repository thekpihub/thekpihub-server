import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "wingcommander-dev-secret-change-in-production";
const TOKEN_EXPIRY = "1h";

export interface JWTPayload {
  sub: string;        // user ID from thekpihub.com
  email: string;
  // Maps directly from thekpihub.com plan slugs:
  // starter → no access (blocked at open-wingman.php)
  // growth  → pro  (full WingCommander, Haiku/Sonnet/Mistral)
  // enterprise → enterprise (all models incl. Opus/GPT-4o/Gemini Pro)
  plan: "pro" | "enterprise";
  name?: string;
  avatarUrl?: string;
  byokApproved?: boolean;  // true = can use own API keys
  iat?: number;
  exp?: number;
}

// ── Issue a token (called by thekpihub.com backend via shared secret) ────────

export function issueToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY, algorithm: "HS256" });
}

// ── Verify + decode a token ───────────────────────────────────────────────────

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JWTPayload;
}

// ── Express middleware — optional auth (attaches user if token present) ───────

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try {
      (req as Request & { user?: JWTPayload }).user = verifyToken(token);
    } catch {
      // invalid token — continue as anonymous
    }
  }
  next();
}

// ── Express middleware — required auth (401 if no valid token) ────────────────

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    (req as Request & { user?: JWTPayload }).user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ── Plan gate — blocks requests below minimum plan tier ───────────────────────

// pro = Growth plan ($99/mo): Haiku, Sonnet, Mistral, Llama
// enterprise = Enterprise plan ($499/mo): all models incl. Opus, GPT-4o, Gemini Pro
const PLAN_RANK: Record<string, number> = { pro: 1, enterprise: 2 };

export function requirePlan(minPlan: JWTPayload["plan"]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: JWTPayload }).user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if ((PLAN_RANK[user.plan] ?? 0) < (PLAN_RANK[minPlan] ?? 0)) {
      return res.status(403).json({
        error: `This feature requires the Enterprise plan`,
        currentPlan: user.plan,
        requiredPlan: minPlan,
        upgradeUrl: "https://thekpihub.com/upgrade.html",
      });
    }
    next();
  };
}

// Model access tiers — enforced per request
export const MODEL_ACCESS: Record<JWTPayload["plan"], string[]> = {
  pro: [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6",
    "mistral-large-latest",
    "llama-3.3-70b-versatile",  // via Groq
  ],
  enterprise: [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6",
    "claude-opus-4-7",
    "mistral-large-latest",
    "llama-3.3-70b-versatile",
    "gpt-4o",
    "gemini-2.0-flash",
    "gemini-2.0-pro",
    "grok-2",
  ],
};

export function requireModelAccess(model: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: JWTPayload }).user;
    if (!user) return res.status(401).json({ error: "Authentication required" });
    const allowed = MODEL_ACCESS[user.plan] ?? [];
    if (!allowed.includes(model)) {
      return res.status(403).json({
        error: `${model} requires the Enterprise plan`,
        allowedModels: allowed,
        upgradeUrl: "https://thekpihub.com/upgrade.html",
      });
    }
    next();
  };
}

function extractToken(req: Request): string | null {
  // 1. Authorization: Bearer <token>
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  // 2. ?token= query param (used for initial handoff from thekpihub.com)
  const query = req.query.token;
  if (typeof query === "string") return query;
  // 3. x-auth-token header
  const xHeader = req.headers["x-auth-token"];
  if (typeof xHeader === "string") return xHeader;
  return null;
}
