CREATE TABLE IF NOT EXISTS auth.users (
  id                         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                      VARCHAR(255) NOT NULL UNIQUE,
  password_hash              VARCHAR(255),
  full_name                  VARCHAR(150) NOT NULL,
  avatar_url                 VARCHAR(500),
  phone                      VARCHAR(20),
  role_id                    UUID         REFERENCES auth.roles(id) ON DELETE SET NULL,
  status                     VARCHAR(30)  NOT NULL DEFAULT 'pending_verification'
                               CHECK (status IN ('active','inactive','suspended','pending_verification')),
  email_verification_token   VARCHAR(255),
  email_verified_at          TIMESTAMPTZ,
  password_reset_token       VARCHAR(255),
  password_reset_expires_at  TIMESTAMPTZ,
  failed_login_attempts      INTEGER      NOT NULL DEFAULT 0,
  locked_until               TIMESTAMPTZ,
  last_login_at              TIMESTAMPTZ,
  last_login_ip              VARCHAR(45),
  google_id                  VARCHAR(100) UNIQUE,
  github_id                  VARCHAR(100) UNIQUE,
  preferences                JSONB        NOT NULL DEFAULT '{}',
  timezone                   VARCHAR(50)  NOT NULL DEFAULT 'Asia/Kolkata',
  locale                     VARCHAR(10)  NOT NULL DEFAULT 'en-IN',
  is_deleted                 BOOLEAN      NOT NULL DEFAULT false,
  deleted_at                 TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status   ON auth.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role_id  ON auth.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON auth.users USING gin(full_name gin_trgm_ops);
