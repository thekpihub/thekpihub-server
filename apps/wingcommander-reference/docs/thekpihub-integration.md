# Integrating Ditto Wingman into thekpihub.com

## Overview

When a premium subscriber clicks **"Open Wingman"** on thekpihub.com:

1. Your server calls `POST /api/auth/token` on the Wingman backend
2. Gets back a short-lived JWT (1 hour)
3. Redirects the user to `https://agent.thekpihub.com/dashboard?token=<JWT>`
4. Wingman verifies the token, strips it from the URL, and logs the user in

---

## Environment Variables

Set these in **both** services:

| Variable | Where | Value |
|---|---|---|
| `HANDOFF_SECRET` | Wingman Railway + thekpihub.com | Same random 32+ char string |
| `JWT_SECRET` | Wingman Railway only | Random 32+ char string |
| `FRONTEND_URL` | Wingman Railway | `https://agent.thekpihub.com` |

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## thekpihub.com Server-Side Code

### Next.js API Route (pages/api/open-wingman.ts)

```typescript
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const WINGMAN_API   = process.env.WINGMAN_API_URL ?? "https://ditto-wingman-api.up.railway.app";
const WINGMAN_URL   = process.env.WINGMAN_URL     ?? "https://agent.thekpihub.com";
const HANDOFF_SECRET = process.env.HANDOFF_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  // Verify Supabase session
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const token = req.headers.authorization?.slice(7) ?? req.cookies["sb-token"] ?? "";
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Not authenticated" });

  // Check subscription tier in your database
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan ?? "free";
  const PREMIUM_PLANS = ["pro", "premium", "enterprise"];
  if (!PREMIUM_PLANS.includes(plan)) {
    return res.redirect("/pricing?reason=premium_required");
  }

  // Mint a Wingman JWT
  const tokenRes = await fetch(`${WINGMAN_API}/api/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sub:       user.id,
      email:     user.email,
      plan,
      name:      user.user_metadata?.full_name,
      avatarUrl: user.user_metadata?.avatar_url,
      secret:    HANDOFF_SECRET,
    }),
  });

  if (!tokenRes.ok) return res.status(500).json({ error: "Failed to issue token" });
  const { token: wingmanToken } = await tokenRes.json();

  // Redirect to Wingman with the token
  res.redirect(`${WINGMAN_URL}/dashboard?token=${wingmanToken}`);
}
```

### Frontend Button (React)

```tsx
function OpenWingmanButton() {
  const handleClick = async () => {
    // Call your API route which handles auth + token minting
    window.location.href = "/api/open-wingman";
  };

  return (
    <button onClick={handleClick} className="btn-premium">
      Open Ditto Wingman ↗
    </button>
  );
}
```

---

## How it Works End-to-End

```
thekpihub.com                    Wingman (Railway)
─────────────────────────────    ──────────────────────────────────────
User clicks "Open Wingman"
  → GET /api/open-wingman
  → verify Supabase session
  → check plan === premium
  → POST /api/auth/token ──────► verify HANDOFF_SECRET
                                 sign JWT { sub, email, plan }
  ← { token: "eyJ..." } ◄───────
  → redirect to
    agent.thekpihub.com/         
    dashboard?token=eyJ...
                                 Frontend receives ?token=
                                 → GET /api/auth/verify (Bearer token)
                                 ← { valid: true, user: {...} }
                                 → store token in localStorage
                                 → strip ?token= from URL
                                 → render dashboard ✅
```

---

## Token Refresh

Tokens expire in **1 hour**. The frontend calls `GET /api/auth/verify` on load.
If the token is expired (401), redirect the user back to thekpihub.com:

```typescript
// In useAuthHandoff.ts — already handles this:
// If verify returns 401 → clearHandoff() → user sees PremiumGate
// → "Go to your dashboard" link → thekpihub.com re-issues a fresh token
```
