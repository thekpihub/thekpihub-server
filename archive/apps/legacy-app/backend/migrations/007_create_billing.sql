CREATE TABLE IF NOT EXISTS billing.plans (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(50)  NOT NULL UNIQUE,
  slug         VARCHAR(50)  NOT NULL UNIQUE,
  description  TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly  NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency      VARCHAR(3)   NOT NULL DEFAULT 'INR',
  limits        JSONB        NOT NULL DEFAULT '{}',
  features      JSONB        NOT NULL DEFAULT '[]',
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  sort_order    INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO billing.plans (name, slug, description, price_monthly, price_yearly, currency, limits, features, sort_order) VALUES
  ('Free',       'free',       'For individuals getting started',
   0, 0, 'INR',
   '{"kpis":5,"users":1,"dashboards":2,"data_retention_days":30}',
   '["5 KPIs","1 user","2 dashboards","30-day history"]',
   1),
  ('Pro',        'pro',        'For growing teams',
   999, 9990, 'INR',
   '{"kpis":50,"users":10,"dashboards":20,"data_retention_days":365}',
   '["50 KPIs","10 users","20 dashboards","1-year history","AI insights","Email reports"]',
   2),
  ('Enterprise', 'enterprise', 'For large organisations',
   4999, 49990, 'INR',
   '{"kpis":-1,"users":-1,"dashboards":-1,"data_retention_days":-1}',
   '["Unlimited KPIs","Unlimited users","Unlimited dashboards","Unlimited history","AI insights","Priority support","SSO","Audit logs"]',
   3)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS billing.subscriptions (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id               UUID        NOT NULL REFERENCES auth.organizations(id) ON DELETE CASCADE,
  plan_id              UUID        NOT NULL REFERENCES billing.plans(id),
  status               VARCHAR(20) NOT NULL DEFAULT 'trialing'
                         CHECK (status IN ('active','trialing','past_due','cancelled','expired')),
  billing_cycle        VARCHAR(10) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '14 days',
  trial_ends_at        TIMESTAMPTZ,
  cancelled_at         TIMESTAMPTZ,
  gateway              VARCHAR(20) CHECK (gateway IN ('razorpay','stripe')),
  gateway_subscription_id VARCHAR(255),
  gateway_customer_id  VARCHAR(255),
  metadata             JSONB       NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id  ON billing.subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON billing.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status  ON billing.subscriptions(status);
