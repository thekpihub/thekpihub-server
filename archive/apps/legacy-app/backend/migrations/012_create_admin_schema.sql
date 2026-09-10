CREATE TABLE IF NOT EXISTS admin.announcements (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(200) NOT NULL,
  body        TEXT        NOT NULL,
  type        VARCHAR(20)  NOT NULL DEFAULT 'info' CHECK (type IN ('info','warning','success','error')),
  target      VARCHAR(20)  NOT NULL DEFAULT 'all'  CHECK (target IN ('all','free','pro','enterprise')),
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin.feature_flags (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_enabled  BOOLEAN      NOT NULL DEFAULT false,
  rollout_pct INTEGER      NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  allowed_orgs JSONB       NOT NULL DEFAULT '[]',
  metadata    JSONB        NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO admin.feature_flags (key, description, is_enabled, rollout_pct) VALUES
  ('ai_insights',         'AI-powered KPI insights via Anthropic',  false, 0),
  ('github_oauth',        'GitHub OAuth login',                      false, 0),
  ('google_oauth',        'Google OAuth login',                      false, 0),
  ('billing_razorpay',    'Razorpay payment gateway',                false, 0),
  ('billing_stripe',      'Stripe payment gateway',                  false, 0),
  ('dashboard_sharing',   'Public dashboard sharing links',          false, 0)
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_announcements_active    ON admin.announcements(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key       ON admin.feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled   ON admin.feature_flags(is_enabled);
