const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');

async function testDB() {
    try {
        console.log("Querying products...");
        const res1 = await db.query('SELECT * FROM products ORDER BY id ASC LIMIT 5');
        console.log("Products rows:", res1.rows.length);
    } catch (e) {
        console.error("Products error:", e.message);
    }

    try {
        console.log("Querying orders...");
        const res2 = await db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
        console.log("Orders rows:", res2.rows.length);
    } catch (e) {
        console.error("Orders error:", e.message);
    }
    
    process.exit(0);
}
testDB();
