const { Pool } = require('pg');
require('dotenv').config({ path: '../server/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        console.log("Checking tables...");
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables:", tables.rows.map(r => r.table_name).join(', '));

        console.log("\nChecking products columns...");
        const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'");
        cols.rows.forEach(c => console.log(`${c.column_name}: ${c.data_type}`));

        console.log("\nChecking for any errors in products query...");
        await pool.query("SELECT * FROM products LIMIT 1");
        console.log("Products query successful");

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await pool.end();
    }
}

check();
