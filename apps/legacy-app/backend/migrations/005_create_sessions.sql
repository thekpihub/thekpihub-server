CREATE TABLE IF NOT EXISTS auth.user_sessions (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  device_info VARCHAR(255),
  ip_address  VARCHAR(45),
  user_agent  VARCHAR(500),
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  expires_at  TIMESTAMPTZ  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON auth.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON auth.user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON auth.user_sessions(expires_at);
