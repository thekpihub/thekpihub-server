import { Router, Request, Response } from "express";
import crypto from "crypto";
import { issueToken, verifyToken, type JWTPayload } from "../middleware/auth.js";

const router = Router();

// Shared secret between thekpihub.com and Ditto Wingman backends.
// Set HANDOFF_SECRET in both environments to the same random value.
const HANDOFF_SECRET = process.env.HANDOFF_SECRET ?? "dev-handoff-secret-change-in-production";

// ── POST /api/auth/token ───────────────────────────────────────────────────────
// Called by thekpihub.com server-side when a premium subscriber opens Wingman.
// Returns a short-lived JWT that the frontend bootstraps from ?token= param.
//
// Request body:
//   { sub, email, plan, name?, avatarUrl?, secret }
//
// The `secret` field must match HANDOFF_SECRET — simple shared-secret guard
// so only your thekpihub.com backend can mint tokens for this instance.

router.post("/token", (req: Request, res: Response) => {
  const { sub, email, plan, name, avatarUrl, secret } = req.body as Record<string, string>;

  if (!sub || !email || !plan) {
    return res.status(400).json({ error: "sub, email, and plan are required" });
  }

  // Constant-time compare to prevent timing attacks
  const provided = Buffer.from(secret ?? "");
  const expected = Buffer.from(HANDOFF_SECRET);
  const match =
    provided.length === expected.length &&
    crypto.timingSafeEqual(provided, expected);

  if (!match) {
    return res.status(401).json({ error: "Invalid handoff secret" });
  }

  const token = issueToken({
    sub,
    email,
    plan: plan as JWTPayload["plan"],
    name,
    avatarUrl,
  });

  res.json({ token, expiresIn: 3600 });
});

// ── GET /api/auth/verify ───────────────────────────────────────────────────────
// Frontend calls this after storing the token to confirm it's still valid.

router.get("/verify", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const payload = verifyToken(token);
    res.json({
      valid: true,
      user: {
        id: payload.sub,
        email: payload.email,
        plan: payload.plan,
        name: payload.name,
        avatarUrl: payload.avatarUrl,
      },
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
    });
  } catch {
    res.status(401).json({ valid: false, error: "Invalid or expired token" });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
// Returns current user from Authorization header (used by frontend on load).

router.get("/me", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = verifyToken(token);
    res.json({
      id: payload.sub,
      email: payload.email,
      plan: payload.plan,
      name: payload.name,
      avatarUrl: payload.avatarUrl,
    });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
