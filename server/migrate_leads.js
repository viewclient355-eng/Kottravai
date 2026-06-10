const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL.");

    // 1. Alter Table
    const alterTableSQL = `
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS company_name text,
      ADD COLUMN IF NOT EXISTS lead_type text DEFAULT 'general' CHECK (lead_type IN ('corporate_gifting', 'wedding', 'retail', 'general')),
      ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS utm_source text,
      ADD COLUMN IF NOT EXISTS utm_medium text,
      ADD COLUMN IF NOT EXISTS utm_campaign text,
      ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
      ADD COLUMN IF NOT EXISTS next_followup_at timestamptz;
    `;
    await client.query(alterTableSQL);
    console.log("✅ Added missing columns to leads table.");

    // 2. Indexes
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
      CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON leads(lead_type);
      CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
      CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
      CREATE INDEX IF NOT EXISTS idx_leads_next_followup_at ON leads(next_followup_at);
    `;
    await client.query(indexesSQL);
    console.log("✅ Created indexes.");

    // 3. RLS Setup
    await client.query(`ALTER TABLE leads ENABLE ROW LEVEL SECURITY;`);
    
    // Drop existing policies safely
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_anon_insert') THEN
          DROP POLICY leads_anon_insert ON leads;
        END IF;
      END
      $$;
    `);

    // Create correct policies
    const rlsSQL = `
      CREATE POLICY "leads_anon_insert" ON leads
      FOR INSERT TO anon
      WITH CHECK (true);
    `;
    await client.query(rlsSQL);
    console.log("✅ Configured RLS policies.");

    // Verification queries
    console.log("\n--- VERIFICATION: COLUMNS ---");
    const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='leads';`);
    console.log(cols.rows.map(r => r.column_name));

    console.log("\n--- VERIFICATION: POLICIES ---");
    const policies = await client.query(`SELECT policyname, cmd, roles FROM pg_policies WHERE tablename='leads';`);
    console.log(policies.rows);

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

runMigration();
