const db = require('./db');

async function testQuery() {
    console.log("Testing products query...");
    try {
        const queryText = 'SELECT * FROM products ORDER BY created_at DESC LIMIT 5';
        const result = await db.query(queryText);
        console.log("✅ Success! Found", result.rows.length, "products.");
        if (result.rows.length > 0) {
            console.log("First product:", result.rows[0].name);
        }
    } catch (err) {
        console.error("❌ Query Failed:", err.message);
        console.error("Full Error:", err);
    } finally {
        process.exit();
    }
}

testQuery();
