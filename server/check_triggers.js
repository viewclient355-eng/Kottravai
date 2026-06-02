const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');

async function checkTriggers() {
    try {
        const res = await db.query(`
            SELECT tgname FROM pg_trigger WHERE tgrelid = 'affiliates'::regclass;
        `);
        console.log("Triggers on affiliates:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkTriggers();
