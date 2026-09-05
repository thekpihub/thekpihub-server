import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { requiredSecret } from "../lib/env.js";

const JWT_SECRET = requiredSecret("JWT_SECRET", "ditto-wingman-dev-secret-change-in-production");
const TOKEN_EXPIRY = "1h";

export interface JWTPayload {
  sub: string;        // user ID from thekpihub.com
  email: string;
  plan: "free" | "pro" | "premium" | "enterprise";
  name?: string;
  avatarUrl?: string;
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

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, premium: 2, enterprise: 3 };

export function requirePlan(minPlan: JWTPayload["plan"]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: JWTPayload }).user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if ((PLAN_RANK[user.plan] ?? 0) < (PLAN_RANK[minPlan] ?? 0)) {
      return res.status(403).json({
        error: `This feature requires the ${minPlan} plan`,
        currentPlan: user.plan,
        requiredPlan: minPlan,
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
