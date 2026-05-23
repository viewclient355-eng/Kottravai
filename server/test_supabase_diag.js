const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log("Checking Supabase Connection...");
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function test() {
    const { data, error } = await supabase.from('products').select('id, name').limit(1);
    if (error) {
        console.error("❌ Supabase Query Failed:", error.message);
        console.error(error);
    } else {
        console.log("✅ Supabase Query Successful. Data count:", data.length);
        console.log("Sample:", data[0]);
    }
}

test();
