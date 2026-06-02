const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');

async function checkSchema() {
    try {
        const res = await db.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'affiliates'::regclass;
        `);
        console.log("Constraints on affiliates:");
        res.rows.forEach(r => console.log(r.conname, ":", r.pg_get_constraintdef));

        const res2 = await db.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'affiliates';
        `);
        console.log("\nIndexes on affiliates:");
        res2.rows.forEach(r => console.log(r.indexname, ":", r.indexdef));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkSchema();
