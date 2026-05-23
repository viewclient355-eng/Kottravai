const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

const sql = `
-- Add gst_server column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_server DECIMAL(10, 2) DEFAULT 0.00;
`;

async function updateDb() {
    try {
        await client.connect();
        await client.query(sql);
        console.log("Successfully added gst_server to orders table.");
    } catch (err) {
        console.error("Update failed:", err.message);
    } finally {
        await client.end();
    }
}

updateDb();
