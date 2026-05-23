const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log("Checking DB Connection...");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "PRESENT" : "MISSING");

let connStr = process.env.DATABASE_URL || '';
if (connStr.includes(':') && connStr.split('@').length > 2) {
    const protocolPart = connStr.split('://')[0];
    const remaining = connStr.split('://')[1];
    const lastAtIndex = remaining.lastIndexOf('@');
    const credentials = remaining.substring(0, lastAtIndex);
    const hostPart = remaining.substring(lastAtIndex + 1);
    
    if (credentials.includes(':')) {
        const [user, ...pwdParts] = credentials.split(':');
        const password = pwdParts.join(':');
        const encodedPassword = encodeURIComponent(password);
        connStr = `${protocolPart}://${user}:${encodedPassword}@${hostPart}`;
        console.log("Encoded Password Fix applied.");
    }
}

const pool = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error("❌ DB Connection Failed:", err.message);
        console.error(err);
    } else {
        console.log("✅ DB Connection Successful:", res.rows[0]);
    }
    pool.end();
});
