const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mailer = require('./utils/mailer');

async function testSmtp() {
    try {
        const isConnected = await mailer.verifyConnection();
        console.log("SMTP Connected:", isConnected);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
testSmtp();
