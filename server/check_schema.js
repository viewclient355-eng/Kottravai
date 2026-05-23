const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.VITE_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'products'
        `);
        console.log('--- Products Table Schema ---');
        res.rows.forEach(r => {
            console.log(`${r.column_name.padEnd(20)} | ${r.data_type.padEnd(15)} | Null: ${r.is_nullable} | Default: ${r.column_default}`);
        });
        await pool.end();
    } catch (err) {
        console.error('❌ Schema check failed:', err.message);
        process.exit(1);
    }
}

checkSchema();
