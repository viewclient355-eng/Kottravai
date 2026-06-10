-- Enable RLS and add recommended policies for `leads`
-- IMPORTANT: Review these policies before applying to production.

-- Enable Row Level Security (if you intend to enforce RLS)
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous & authenticated inserts from client (use with caution)
-- This policy permits inserts when the request is coming via an anon/auth key.
-- It also requires that `source` is provided to avoid empty junk rows.
CREATE POLICY IF NOT EXISTS allow_insert_from_client ON leads
  FOR INSERT
  USING (true)
  WITH CHECK (
    (auth.role() = 'anon' OR auth.role() = 'authenticated')
    AND (COALESCE(source, '') <> '')
  );

-- Allow admins (service_role) to SELECT/INSERT/UPDATE/DELETE via server (service role bypasses RLS)
-- No explicit policy required for service_role; service_role bypasses RLS by design.

-- Optional: Restrict SELECT to authenticated users (if desired)
-- CREATE POLICY IF NOT EXISTS allow_select_authenticated ON leads
--   FOR SELECT
--   USING (auth.role() = 'authenticated');

-- Recommend: After applying, verify policies with `
-- SELECT policyname, permissive, roles, qual, with_check FROM pg_policies WHERE tablename = 'leads';
