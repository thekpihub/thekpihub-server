CREATE TABLE IF NOT EXISTS kpis.categories (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID        NOT NULL REFERENCES auth.organizations(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  color       VARCHAR(7),
  icon        VARCHAR(50),
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, name)
);

CREATE TABLE IF NOT EXISTS kpis.kpis (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID        NOT NULL REFERENCES auth.organizations(id) ON DELETE CASCADE,
  category_id     UUID        REFERENCES kpis.categories(id) ON DELETE SET NULL,
  created_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  unit            VARCHAR(50),
  direction       VARCHAR(10) NOT NULL DEFAULT 'up' CHECK (direction IN ('up','down','neutral')),
  frequency       VARCHAR(20) NOT NULL DEFAULT 'monthly'
                    CHECK (frequency IN ('daily','weekly','monthly','quarterly','yearly')),
  formula         TEXT,
  data_source     VARCHAR(100),
  owner_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','draft')),
  tags            JSONB       NOT NULL DEFAULT '[]',
  metadata        JSONB       NOT NULL DEFAULT '{}',
  is_public       BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpis.kpi_values (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_id       UUID        NOT NULL REFERENCES kpis.kpis(id) ON DELETE CASCADE,
  value        NUMERIC(20,6) NOT NULL,
  recorded_at  TIMESTAMPTZ NOT NULL,
  note         TEXT,
  source       VARCHAR(100),
  recorded_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kpi_id, recorded_at)
);

CREATE TABLE IF NOT EXISTS kpis.kpi_targets (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_id      UUID        NOT NULL REFERENCES kpis.kpis(id) ON DELETE CASCADE,
  target_value NUMERIC(20,6) NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end   TIMESTAMPTZ NOT NULL,
  label        VARCHAR(100),
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpis_org_id      ON kpis.kpis(org_id);
CREATE INDEX IF NOT EXISTS idx_kpis_category_id ON kpis.kpis(category_id);
CREATE INDEX IF NOT EXISTS idx_kpis_status      ON kpis.kpis(status);
CREATE INDEX IF NOT EXISTS idx_kpis_owner_id    ON kpis.kpis(owner_id);
CREATE INDEX IF NOT EXISTS idx_kpis_name_trgm   ON kpis.kpis USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kpi_values_kpi_id     ON kpis.kpi_values(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_values_recorded_at ON kpis.kpi_values(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_kpi_id    ON kpis.kpi_targets(kpi_id);
