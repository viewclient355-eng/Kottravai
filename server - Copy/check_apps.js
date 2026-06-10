const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');

async function checkApps() {
    try {
        const res = await db.query(`
            SELECT * FROM affiliate_applications WHERE status = 'pending';
        `);
        console.log("Pending Applications:");
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkApps();
