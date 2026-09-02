-- BYOK + Admin Approval Schema Migration
-- Run this in the Supabase SQL editor for project: eeuwkislidznpgdbvvbo
-- Safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- ── 1. Add BYOK columns to profiles ──────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS byok_approved       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS byok_approved_at    timestamptz,
  ADD COLUMN IF NOT EXISTS byok_approved_by    text;

-- ── 2. Admin approval requests ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS byok_approval_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users NOT NULL,
  email        text,
  plan         text,
  status       text DEFAULT 'pending',   -- pending | approved | rejected
  requested_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS: users can insert/select their own request; admins use service role
ALTER TABLE byok_approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "users_own_request" ON byok_approval_requests
  FOR ALL USING (auth.uid() = user_id);

-- ── 3. Encrypted user API keys ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_api_keys (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users NOT NULL,
  provider     text NOT NULL,           -- anthropic | openai | google | mistral | groq
  key_encrypted text NOT NULL,          -- AES-256-GCM: iv:tag:ciphertext (all hex)
  key_hint     text,                    -- last 4 chars of plaintext key for display
  label        text,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE(user_id, provider)
);

-- RLS: only the backend service role reads/writes (never expose keys to client)
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
-- No client-level policies — all access goes through WingCommander backend (service role)
