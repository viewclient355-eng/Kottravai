-- Migration: Add lead fields for AI Sales Agents

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure a basic leads table exists (safe if already present)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add required columns (safe: IF NOT EXISTS)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_priority_check') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_priority_check CHECK (priority IN ('low','medium','high'));
  END IF;
END$$;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMP WITH TIME ZONE;

-- Optional: create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_next_followup_at ON leads(next_followup_at);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads(utm_source);
CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
