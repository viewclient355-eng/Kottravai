require('dotenv').config();
const db = require('../db');

async function checkSchema() {
    try {
        const res = await db.query(`
            SELECT column_name, udt_name, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'knowledge' AND column_name = 'embedding'
        `);
        console.log("Column Info:", res.rows);
        
        // Check dimension specifically for vector type
        const dimRes = await db.query(`
            SELECT atttypmod FROM pg_attribute 
            WHERE attrelid = 'knowledge'::regclass AND attname = 'embedding'
        `);
        console.log("Dimension Mod:", dimRes.rows[0].atttypmod);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkSchema();
