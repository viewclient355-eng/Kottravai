require('dotenv').config();
const db = require('../db');
const fs = require('fs');
const path = require('path');

async function runHardening() {
    console.log("🚀 Running Production Hardening Migration...");
    try {
        const sqlPath = path.join(__dirname, 'production_hardening.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await db.query(sql);
        console.log("✅ Production hardening migration successful!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
}

runHardening();
