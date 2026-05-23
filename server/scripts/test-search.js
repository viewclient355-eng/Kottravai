const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testSearch(q) {
    console.log(`\n🔍 TESTING QUERY: "${q}"`);
    try {
        const searchTerm = q.trim();
        // We use the same logic as implemented in index.js
        const queryText = `
            SELECT name, category, 
            (
                similarity(name, $1) * 3 + 
                similarity(category, $1) * 2 + 
                similarity(COALESCE(description, ''), $1)
            ) as relevance
            FROM products
            WHERE 
                is_live = TRUE AND
                (
                    name ILIKE $2 OR 
                    category ILIKE $2 OR 
                    description ILIKE $2 OR
                    similarity(name, $1) > 0.1
                )
            ORDER BY relevance DESC
            LIMIT 3
        `;
        
        const result = await pool.query(queryText, [searchTerm, `%${searchTerm}%`]);
        
        if (result.rows.length === 0) {
            console.log("❌ No results found.");
        } else {
            console.table(result.rows.map(r => ({
                Name: r.name,
                Category: r.category,
                Relevance: parseFloat(r.relevance).toFixed(4)
            })));
        }
    } catch (err) {
        console.error("💥 Error during search:", err.message);
    }
}

async function runTests() {
    console.log("🚀 Starting Search Logic Validation...");
    const terms = ["idy", "dosa", "soap", "mix", "rice", "banana fiber", "blue necklase", "hampers"];
    
    for (const term of terms) {
        await testSearch(term);
    }
    
    await pool.end();
    console.log("\n✅ Test suite completed.");
}

runTests();
