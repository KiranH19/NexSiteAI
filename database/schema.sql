-- ============================================================
-- NexSite Database Schema for Supabase
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Table: generation_sessions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS generation_sessions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_data      JSONB NOT NULL,
  generated_content  JSONB,
  selected_template  TEXT,
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Table: websites ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS websites (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name   TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  category        TEXT,
  template        TEXT DEFAULT 'business',
  design_style    TEXT DEFAULT 'modern',
  content_json    JSONB,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  logo_url        TEXT,
  plan            TEXT DEFAULT 'starter',
  payment_status  TEXT DEFAULT 'pending',
  status          TEXT DEFAULT 'draft',
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Table: leads ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id  UUID REFERENCES websites(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  message     TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Table: subscriptions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id    UUID REFERENCES websites(id) ON DELETE CASCADE,
  plan          TEXT NOT NULL,
  amount        INTEGER NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly',
  status        TEXT DEFAULT 'active',
  next_due_date DATE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Table: payments ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id            UUID REFERENCES websites(id) ON DELETE CASCADE,
  razorpay_order_id     TEXT,
  razorpay_payment_id   TEXT,
  razorpay_signature    TEXT,
  amount                INTEGER NOT NULL,
  currency              TEXT DEFAULT 'INR',
  status                TEXT DEFAULT 'pending',
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Indexes for performance ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_websites_slug           ON websites(slug);
CREATE INDEX IF NOT EXISTS idx_websites_status         ON websites(status);
CREATE INDEX IF NOT EXISTS idx_leads_website_id        ON leads(website_id);
CREATE INDEX IF NOT EXISTS idx_payments_website_id     ON payments(website_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id       ON payments(razorpay_order_id);

-- ─── Auto-update updated_at on websites ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_websites_updated_at
  BEFORE UPDATE ON websites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Row Level Security (disable for service role, enable for anon) ───────────
ALTER TABLE websites          ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads             ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public read on published websites
CREATE POLICY "Public can read published websites"
  ON websites FOR SELECT
  USING (status = 'published');

-- Allow public to insert leads
CREATE POLICY "Public can insert leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Service role bypasses all RLS (automatic in Supabase)
