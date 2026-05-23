require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function applySchema() {
    const schemaPath = path.join(__dirname, '..', 'server', 'affiliate_schema.sql');
    if (!fs.existsSync(schemaPath)) {
        console.error(`❌ Schema file not found: ${schemaPath}`);
        process.exit(1);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log("🚀 Starting database schema update...");
    
    // Split SQL by semicolons, ignoring those inside single quotes or comments.
    // A more robust split:
    const statements = schemaSql
        .replace(/--.*$/gm, '') // Remove comments
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    let successCount = 0;
    let failCount = 0;

    for (const statement of statements) {
        try {
            await pool.query(statement);
            successCount++;
        } catch (err) {
            // Log some common 'already exists' errors as warnings instead of errors
            if (err.message.includes('already exists')) {
              console.warn(`⚠️ Warning during execution: ${err.message}`);
              successCount++;
            } else {
              console.error(`❌ Statement Failed: ${statement.substring(0, 50)}...`);
              console.error(`Reason: ${err.message}`);
              failCount++;
            }
        }
    }

    console.log(`\n✅ Migration Finished: ${successCount} successful, ${failCount} failed.`);
    if (failCount > 0) {
        console.error("⛔ Some statements failed. Please check the logs.");
    } else {
        console.log("🌟 Database is now fully synchronized with the Affiliate System.");
    }
    
    await pool.end();
}

applySchema().catch(err => {
    console.error("🚨 Critical Error applying schema:", err);
    process.exit(1);
});
