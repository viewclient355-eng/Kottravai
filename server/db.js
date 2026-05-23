const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { Pool } = require('pg');

let pool;

if (!process.env.DATABASE_URL && !process.env.VITE_DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL environment variable is missing!");
    // Create a mock pool that fails gracefully on query
    pool = {
        query: async () => {
            const errorMsg = "❌ Database not configured: DATABASE_URL is missing in environment variables.";
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
    };
} else {
    try {
        let connStr = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL || '';
        
        // FIX: If the password contains '@', it breaks the URL parser.
        // We detect if there are multiple '@' symbols and encode the ones in the password section.
        if (connStr.includes(':') && connStr.split('@').length > 2) {
            const protocolPart = connStr.split('://')[0];
            const remaining = connStr.split('://')[1];
            const lastAtIndex = remaining.lastIndexOf('@');
            const credentials = remaining.substring(0, lastAtIndex);
            const hostPart = remaining.substring(lastAtIndex + 1);
            
            if (credentials.includes(':')) {
                const [user, ...pwdParts] = credentials.split(':');
                const password = pwdParts.join(':'); // Handle passwords with ':' too
                const encodedPassword = encodeURIComponent(password);
                connStr = `${protocolPart}://${user}:${encodedPassword}@${hostPart}`;
                console.log("🔧 Auto-fixed DATABASE_URL: Encoded password special characters.");
            }
        }

        pool = new Pool({
            connectionString: connStr,
            ssl: { rejectUnauthorized: false }
        });
    } catch (err) {
        console.error("❌ ERROR: Failed to create Postgres Pool:", err);
        pool = {
            query: async () => {
                console.error("❌ Cannot execute query: Pool creation failed.");
                throw new Error("Database connection failed");
            }
        };
    }
}

// Pre-warm the connection
if (pool.query) {
    pool.query('SELECT NOW()')
        .then(() => console.log('🚀 DB Connection Pre-warmed'))
        .catch(err => console.error('⚠️ DB Warmup failed:', err.message));
}

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
