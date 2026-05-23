require('dotenv').config();
const { query } = require('./db');

async function checkProducts() {
    try {
        console.log("--- Checking Products Table ---");
        const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'");
        console.log("Columns:", res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

        // Let's see if hub column exists
        const hubExists = res.rows.some(r => r.column_name === 'hub');
        if (!hubExists) {
            console.log("❌ 'hub' column does NOT exist in 'products' table.");
        } else {
            const products = await query("SELECT id, name, hub FROM products LIMIT 5");
            console.log("Sample Products Hubs:", products.rows);

            const hubCount = await query("SELECT hub, count(*) FROM products GROUP BY hub");
            console.log("Hub Counts:", hubCount.rows);
        }

    } catch (err) {
        console.error("❌ Error checking products:", err.message);
    }
}

checkProducts();
