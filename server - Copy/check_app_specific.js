const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');

async function checkApp() {
    try {
        const res = await db.query(`
            SELECT * FROM affiliate_applications WHERE id = 'a64cf85c-8a27-4c8b-ba75-e5236eebc279';
        `);
        console.log("Specific Application:");
        console.log(res.rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkApp();
