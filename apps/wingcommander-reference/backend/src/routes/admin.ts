import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const SUPABASE_URL          = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const MASTER_ADMIN_ID       = process.env.MASTER_ADMIN_ID ?? "";

// Middleware: only the master admin can access these routes
function requireAdmin(req: Request, res: Response, next: () => void) {
  const user = (req as Request & { user?: { sub: string } }).user;
  if (!user || !MASTER_ADMIN_ID || user.sub !== MASTER_ADMIN_ID) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

async function supabasePatch(path: string, body: object) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function supabaseGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Accept": "application/json",
    },
  });
  return { status: res.status, body: await res.json().catch(() => []) };
}

// GET /api/admin/byok/users — list all BYOK-approved users
router.get("/byok/users", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const result = await supabaseGet(
    "profiles?select=id,email,first_name,last_name,plan,byok_approved,byok_approved_at&byok_approved=eq.true&order=byok_approved_at.desc"
  );
  res.status(result.status).json(result.body);
});

// GET /api/admin/byok/requests — list pending approval requests
router.get("/byok/requests", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const result = await supabaseGet(
    "byok_approval_requests?select=*&status=eq.pending&order=requested_at.desc"
  );
  res.status(result.status).json(result.body);
});

// POST /api/admin/byok/approve/:userId — grant BYOK access
router.post("/byok/approve/:userId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { userId } = req.params;
  const adminUser = (req as Request & { user?: { sub: string } }).user;

  const result = await supabasePatch(
    `profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      byok_approved: true,
      byok_approved_at: new Date().toISOString(),
      byok_approved_by: adminUser?.sub ?? "admin",
    }
  );

  if (result.status < 300) {
    // Also update the approval request status
    await supabasePatch(
      `byok_approval_requests?user_id=eq.${encodeURIComponent(userId)}`,
      { status: "approved" }
    ).catch(() => null);
  }

  res.status(result.status).json({ success: result.status < 300 });
});

// DELETE /api/admin/byok/revoke/:userId — revoke BYOK access
router.delete("/byok/revoke/:userId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await supabasePatch(
    `profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      byok_approved: false,
      byok_approved_at: null,
      byok_approved_by: null,
    }
  );

  res.status(result.status).json({ success: result.status < 300 });
});

// GET /api/admin/stats — basic platform usage stats
router.get("/stats", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const [users, growth, enterprise, byok] = await Promise.all([
    supabaseGet("profiles?select=id&limit=1"),
    supabaseGet("profiles?select=id&plan=eq.growth"),
    supabaseGet("profiles?select=id&plan=eq.enterprise"),
    supabaseGet("profiles?select=id&byok_approved=eq.true"),
  ]);

  res.json({
    note: "Counts reflect live Supabase data",
    growthUsers:      Array.isArray(growth.body) ? growth.body.length : "?",
    enterpriseUsers:  Array.isArray(enterprise.body) ? enterprise.body.length : "?",
    byokApproved:     Array.isArray(byok.body) ? byok.body.length : "?",
  });
});

export default router;
