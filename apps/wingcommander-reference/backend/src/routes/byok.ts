import { Router, Request, Response } from "express";
import crypto from "crypto";
import { requireAuth, type JWTPayload } from "../middleware/auth.js";

const router = Router();

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BYOK_ENCRYPTION_KEY = process.env.BYOK_ENCRYPTION_KEY ?? "";

const VALID_PROVIDERS = ["anthropic", "openai", "google", "mistral", "groq"] as const;
type Provider = typeof VALID_PROVIDERS[number];

// ── Encryption helpers ────────────────────────────────────────────────────────

function encryptKey(plaintext: string): string {
  if (!BYOK_ENCRYPTION_KEY) throw new Error("BYOK_ENCRYPTION_KEY not configured");
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(BYOK_ENCRYPTION_KEY, "hex");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptKey(data: string): string {
  if (!BYOK_ENCRYPTION_KEY) throw new Error("BYOK_ENCRYPTION_KEY not configured");
  const [ivHex, tagHex, encHex] = data.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(BYOK_ENCRYPTION_KEY, "hex"),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(Buffer.from(encHex, "hex")).toString("utf8") + decipher.final("utf8");
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function sbGet(path: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Accept: "application/json",
    },
  });
  return r.json().catch(() => []);
}

async function sbUpsert(table: string, body: object) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

async function sbDelete(table: string, filter: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  return r.status;
}

async function isByokApproved(userId: string): Promise<boolean> {
  const rows = await sbGet(`profiles?id=eq.${userId}&select=byok_approved`);
  return Array.isArray(rows) && rows[0]?.byok_approved === true;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/user/byok-status
router.get("/user/byok-status", requireAuth, async (req: Request, res: Response) => {
  const user = (req as Request & { user?: JWTPayload }).user!;
  const rows = await sbGet(
    `profiles?id=eq.${user.sub}&select=byok_approved,byok_approved_at`
  );
  const profile = Array.isArray(rows) ? rows[0] : null;
  res.json({
    approved: !!profile?.byok_approved,
    approvedAt: profile?.byok_approved_at ?? null,
  });
});

// POST /api/user/byok-request — user submits a request for admin approval
router.post("/user/byok-request", requireAuth, async (req: Request, res: Response) => {
  const user = (req as Request & { user?: JWTPayload }).user!;
  const result = await sbUpsert("byok_approval_requests", {
    user_id: user.sub,
    email: user.email,
    plan: user.plan,
    status: "pending",
    requested_at: new Date().toISOString(),
  });
  res.status(result.status < 300 ? 200 : 500).json({ success: result.status < 300 });
});

// GET /api/user/api-keys — list configured provider keys (masked, last 4 chars only)
router.get("/user/api-keys", requireAuth, async (req: Request, res: Response) => {
  const user = (req as Request & { user?: JWTPayload }).user!;
  if (!(await isByokApproved(user.sub))) {
    return res.status(403).json({ error: "BYOK access not approved" });
  }
  const rows = await sbGet(
    `user_api_keys?user_id=eq.${user.sub}&select=id,provider,key_hint,label,is_active,created_at,last_used_at&order=created_at.desc`
  );
  res.json(Array.isArray(rows) ? rows : []);
});

// POST /api/user/api-keys — store a new key (encrypted)
router.post("/user/api-keys", requireAuth, async (req: Request, res: Response) => {
  const user = (req as Request & { user?: JWTPayload }).user!;
  const { provider, key, label } = req.body as {
    provider?: string;
    key?: string;
    label?: string;
  };

  if (!provider || !key) {
    return res.status(400).json({ error: "provider and key are required" });
  }
  if (!(VALID_PROVIDERS as readonly string[]).includes(provider)) {
    return res.status(400).json({ error: `provider must be one of: ${VALID_PROVIDERS.join(", ")}` });
  }
  if (!(await isByokApproved(user.sub))) {
    return res.status(403).json({ error: "BYOK access not approved" });
  }
  if (!BYOK_ENCRYPTION_KEY) {
    return res.status(500).json({ error: "Server encryption not configured" });
  }

  const trimmed = key.trim();
  const key_encrypted = encryptKey(trimmed);
  const key_hint = trimmed.slice(-4);

  const result = await sbUpsert("user_api_keys", {
    user_id: user.sub,
    provider: provider as Provider,
    key_encrypted,
    key_hint,
    label: label?.trim() || provider,
    is_active: true,
    created_at: new Date().toISOString(),
  });

  res.status(result.status < 300 ? 200 : 500).json({
    success: result.status < 300,
    hint: key_hint,
  });
});

// DELETE /api/user/api-keys/:provider — remove a stored key
router.delete("/user/api-keys/:provider", requireAuth, async (req: Request, res: Response) => {
  const user = (req as Request & { user?: JWTPayload }).user!;
  const { provider } = req.params;

  const status = await sbDelete(
    "user_api_keys",
    `user_id=eq.${encodeURIComponent(user.sub)}&provider=eq.${encodeURIComponent(provider)}`
  );
  res.status(status < 300 ? 200 : 500).json({ success: status < 300 });
});

export default router;
