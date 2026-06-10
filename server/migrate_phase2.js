const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const alterTableSQL = `
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS ai_reasoning text,
      ADD COLUMN IF NOT EXISTS ai_next_action text,
      ADD COLUMN IF NOT EXISTS lead_temperature text DEFAULT 'cold' CHECK (lead_temperature IN ('hot', 'warm', 'cold')),
      ADD COLUMN IF NOT EXISTS qualification_status text DEFAULT 'new' CHECK (qualification_status IN ('qualified', 'needs_nurture', 'disqualified', 'new'));
    `;
    await client.query(alterTableSQL);
    console.log("✅ Added Phase 2 AI columns to leads table.");

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

runMigration();
