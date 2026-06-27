-- ============================================================
-- NexSite CMS Schema Additions
-- Run this AFTER the original schema.sql in Supabase SQL Editor
-- ============================================================

-- ─── Add owner_id to websites (links to Supabase Auth user) ──────────────────
ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── Add owner_id to generation_sessions ─────────────────────────────────────
ALTER TABLE generation_sessions
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── Table: cms_edits (audit log of every content change) ────────────────────
CREATE TABLE IF NOT EXISTS cms_edits (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id   UUID REFERENCES websites(id) ON DELETE CASCADE,
  owner_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  section      TEXT NOT NULL,   -- 'hero' | 'services' | 'faq' | 'contact' | 'branding'
  old_value    JSONB,
  new_value    JSONB,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Index for fast lookup ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_websites_owner_id  ON websites(owner_id);
CREATE INDEX IF NOT EXISTS idx_cms_edits_website  ON cms_edits(website_id);

-- ─── RLS: owners can read + update ONLY their own websites ───────────────────
-- Allow owner to read their website (even if draft)
CREATE POLICY "Owner can read own website"
  ON websites FOR SELECT
  USING (auth.uid() = owner_id);

-- Allow owner to update their own website content
CREATE POLICY "Owner can update own website"
  ON websites FOR UPDATE
  USING (auth.uid() = owner_id);

-- Allow owner to insert cms_edits for their website
CREATE POLICY "Owner can insert cms_edits"
  ON cms_edits FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Allow owner to read their own cms_edits
CREATE POLICY "Owner can read own cms_edits"
  ON cms_edits FOR SELECT
  USING (auth.uid() = owner_id);
