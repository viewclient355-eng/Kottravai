const db = require('./db');

async function checkExtension() {
    console.log("Checking pg_trgm extension...");
    try {
        const result = await db.query("SELECT * FROM pg_extension WHERE extname = 'pg_trgm'");
        if (result.rows.length > 0) {
            console.log("✅ pg_trgm extension is ENABLED.");
        } else {
            console.error("❌ pg_trgm extension is NOT ENABLED.");
            console.log("Trying to enable it...");
            await db.query("CREATE EXTENSION IF NOT EXISTS pg_trgm");
            console.log("✅ Extension enabled successfully (hopefully).");
        }
    } catch (err) {
        console.error("❌ Error checking/enabling extension:", err.message);
        console.error("This usually happens if you are not a superuser or the DB doesn't support it.");
    } finally {
        process.exit();
    }
}

checkExtension();
