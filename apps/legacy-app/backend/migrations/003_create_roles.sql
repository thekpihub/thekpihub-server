CREATE TABLE IF NOT EXISTS auth.roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(50)  NOT NULL UNIQUE,
  description VARCHAR(255),
  permissions JSONB        NOT NULL DEFAULT '[]',
  is_system   BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO auth.roles (name, description, permissions, is_system) VALUES
  ('super_admin', 'Full system access',        '["*"]',                                                                                        true),
  ('admin',       'Organization admin',        '["users:manage","kpis:manage","kpis:read","kpis:write","dashboards:manage","billing:view"]',  true),
  ('analyst',     'KPI analyst',               '["kpis:read","kpis:write","dashboards:manage","dashboards:read"]',                             true),
  ('viewer',      'Read-only access',          '["kpis:read","dashboards:read"]',                                                              true)
ON CONFLICT (name) DO NOTHING;
