CREATE TABLE IF NOT EXISTS auth.organizations (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(150) NOT NULL,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  logo_url   VARCHAR(500),
  website    VARCHAR(255),
  industry   VARCHAR(100),
  size       VARCHAR(10)  CHECK (size IN ('1-10','11-50','51-200','201-500','500+')),
  owner_id   UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  settings   JSONB        NOT NULL DEFAULT '{}',
  is_active  BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.org_members (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     UUID        NOT NULL REFERENCES auth.organizations(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id    UUID        REFERENCES auth.roles(id) ON DELETE SET NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'invited' CHECK (status IN ('active','invited','suspended')),
  joined_at  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_orgs_slug         ON auth.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_members_org   ON auth.org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user  ON auth.org_members(user_id);
