require('dotenv').config();
const { query } = require('./db');

async function fixHubs() {
    try {
        console.log("🛠️  Starting Hub Fix...");
        
        // 1. Add hub column if not exists
        await query("ALTER TABLE products ADD COLUMN IF NOT EXISTS hub VARCHAR(100)");
        console.log("✅ 'hub' column ensured in 'products' table.");

        // 2. Tag Coconut Shell products with Mathalampaarai hub
        const updateRes = await query(`
            UPDATE products 
            SET hub = 'mathalampaarai' 
            WHERE category_slug = 'coco-crafts' 
            AND (hub IS NULL OR hub = '')
        `);
        console.log(`✅ Tagged ${updateRes.rowCount} coconut products with 'mathalampaarai' hub.`);

        // 3. Double Check
        const check = await query("SELECT name, hub, category_slug FROM products WHERE category_slug = 'coco-crafts'");
        console.log("Updated Products:", check.rows);

    } catch (err) {
        console.error("❌ Fix failed:", err.message);
    }
}

fixHubs();
