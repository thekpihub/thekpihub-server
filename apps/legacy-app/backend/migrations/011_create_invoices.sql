CREATE TABLE IF NOT EXISTS billing.gateway_customers (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              UUID        NOT NULL REFERENCES auth.organizations(id) ON DELETE CASCADE,
  gateway             VARCHAR(20) NOT NULL CHECK (gateway IN ('razorpay','stripe')),
  gateway_customer_id VARCHAR(255) NOT NULL,
  metadata            JSONB       NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, gateway)
);

CREATE TABLE IF NOT EXISTS billing.invoices (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id             UUID        NOT NULL REFERENCES auth.organizations(id) ON DELETE CASCADE,
  subscription_id    UUID        REFERENCES billing.subscriptions(id) ON DELETE SET NULL,
  gateway            VARCHAR(20) NOT NULL CHECK (gateway IN ('razorpay','stripe')),
  gateway_invoice_id VARCHAR(255),
  gateway_payment_id VARCHAR(255),
  amount             NUMERIC(10,2) NOT NULL,
  currency           VARCHAR(3)   NOT NULL DEFAULT 'INR',
  status             VARCHAR(20)  NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','paid','failed','refunded','void')),
  invoice_date       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  paid_at            TIMESTAMPTZ,
  due_date           TIMESTAMPTZ,
  pdf_url            VARCHAR(500),
  line_items         JSONB        NOT NULL DEFAULT '[]',
  metadata           JSONB        NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gateway_customers_org_id  ON billing.gateway_customers(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id           ON billing.invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id  ON billing.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status           ON billing.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date     ON billing.invoices(invoice_date DESC);
