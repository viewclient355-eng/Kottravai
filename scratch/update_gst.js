const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

const sql = `
-- 1. Add gst_rate column to products table if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate numeric DEFAULT 0;

-- 2. Update GST rates based on categories and keywords

-- Coconut shell products (5%)
UPDATE products SET gst_rate = 5 
WHERE category ILIKE '%coconut%' OR name ILIKE '%coconut%';

-- Terracotta jewellery (3%)
UPDATE products SET gst_rate = 3 
WHERE category ILIKE '%terracotta%' OR name ILIKE '%terracotta%';

-- Banana fibre (5%)
UPDATE products SET gst_rate = 5 
WHERE category ILIKE '%banana%' OR name ILIKE '%banana%';

-- Idli Podi (5%)
UPDATE products SET gst_rate = 5 
WHERE name ILIKE '%idli%' OR name ILIKE '%podi%';

-- Dosa mix (18%)
UPDATE products SET gst_rate = 18 
WHERE name ILIKE '%dosa%';

-- Rice mix (18%)
UPDATE products SET gst_rate = 18 
WHERE name ILIKE '%rice mix%';

-- Overall mix / Health mix (18%)
UPDATE products SET gst_rate = 18 
WHERE name ILIKE '%health mix%' OR name ILIKE '%mix%' AND name NOT ILIKE '%dosa%' AND name NOT ILIKE '%rice mix%';

-- Soap (18%)
UPDATE products SET gst_rate = 18 
WHERE category ILIKE '%care%' OR name ILIKE '%soap%';

-- Just to be safe, any other food items might need a default, but we'll leave as 0 if unknown, or maybe 18 as default?
-- The user didn't specify a default, so we'll leave the default as 0.
`;

async function updateGst() {
    try {
        await client.connect();
        console.log("Connected to database.");
        await client.query(sql);
        console.log("Successfully added gst_rate and updated product GST values.");
        
        // Let's verify the updates
        const res = await client.query('SELECT category, name, gst_rate FROM products LIMIT 10;');
        console.table(res.rows);
    } catch (err) {
        console.error("Update failed:", err.message);
    } finally {
        await client.end();
    }
}

updateGst();
