const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    const { data, error } = await supabase.storage.from('products').list('', { limit: 100 });
    if (error) {
        console.error('Error listing products:', error);
        return;
    }
    console.log('--- Files in "products" bucket ---');
    data.forEach(f => console.log(f.name));

    const { data: teamData, error: teamError } = await supabase.storage.from('products').list('team', { limit: 100 });
    if (!teamError) {
        console.log('\n--- Files in "products" bucket / team ---');
        teamData.forEach(f => console.log(f.name));
    }
}

checkStorage();
