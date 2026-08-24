CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS infrastructure_nodes (
    node_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_name VARCHAR(64) NOT NULL UNIQUE,
    environment_target VARCHAR(32) NOT NULL CHECK (environment_target IN ('production', 'staging', 'sandbox')),
    is_operational BOOLEAN DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS kpi_streams (
    stream_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id UUID REFERENCES infrastructure_nodes(node_id) ON DELETE SET NULL,
    metric_name VARCHAR(128) NOT NULL UNIQUE,
    current_value DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS kpi_stream_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID NOT NULL REFERENCES kpi_streams(stream_id) ON DELETE CASCADE,
    observed_value DECIMAL(12, 4) NOT NULL,
    status_flag VARCHAR(16) NOT NULL CHECK (status_flag IN ('nominal', 'warning', 'critical', 'dropped')),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kpi_streams_active ON kpi_streams(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_kpi_logs_stream_timestamp ON kpi_stream_logs(stream_id, recorded_at DESC);

ALTER TABLE infrastructure_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_stream_logs ENABLE ROW LEVEL SECURITY;
