const db = require('./db');

async function testRecentSales() {
    console.log("Testing recent sales query...");
    try {
        const queryText = `
            SELECT customer_name, city, items, created_at 
            FROM orders 
            WHERE status != 'Cancelled' AND status != 'Refunded'
            ORDER BY created_at DESC 
            LIMIT 15
        `;
        const result = await db.query(queryText);
        console.log("✅ Success! Found", result.rows.length, "recent sales.");
    } catch (err) {
        console.error("❌ Query Failed:", err.message);
        console.error("Full Error:", err);
    } finally {
        process.exit();
    }
}

testRecentSales();
