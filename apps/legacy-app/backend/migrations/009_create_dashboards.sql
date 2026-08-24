CREATE TABLE IF NOT EXISTS kpis.dashboards (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID        NOT NULL REFERENCES auth.organizations(id) ON DELETE CASCADE,
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  layout      JSONB       NOT NULL DEFAULT '[]',
  is_default  BOOLEAN     NOT NULL DEFAULT false,
  is_public   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpis.dashboard_widgets (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  dashboard_id UUID        NOT NULL REFERENCES kpis.dashboards(id) ON DELETE CASCADE,
  kpi_id       UUID        REFERENCES kpis.kpis(id) ON DELETE CASCADE,
  widget_type  VARCHAR(50) NOT NULL DEFAULT 'line_chart'
                 CHECK (widget_type IN ('line_chart','bar_chart','gauge','number','table','pie_chart','area_chart')),
  title        VARCHAR(200),
  config       JSONB       NOT NULL DEFAULT '{}',
  position     JSONB       NOT NULL DEFAULT '{"x":0,"y":0,"w":4,"h":3}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboards_org_id     ON kpis.dashboards(org_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_created_by ON kpis.dashboards(created_by);
CREATE INDEX IF NOT EXISTS idx_widgets_dashboard_id  ON kpis.dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_widgets_kpi_id        ON kpis.dashboard_widgets(kpi_id);
