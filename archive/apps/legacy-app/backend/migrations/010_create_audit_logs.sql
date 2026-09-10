CREATE TABLE IF NOT EXISTS audit.audit_logs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID        REFERENCES auth.organizations(id) ON DELETE SET NULL,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  VARCHAR(45),
  user_agent  VARCHAR(500),
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_org_id      ON audit.audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id     ON audit.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action      ON audit.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity      ON audit.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at  ON audit.audit_logs(created_at DESC);
