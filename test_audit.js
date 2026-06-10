const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'server/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    // 1. Fetch an existing lead
    const { data: lead } = await supabase.from('leads').select('id').limit(1).single();
    const testLeadId = lead.id;
    console.log(`Using test lead: ${testLeadId}`);

    const adminPass = process.env.VITE_ADMIN_PASSWORD || 'Admin!Kottravai2025%100';
    
    await axios.patch(`http://localhost:5000/api/admin/leads/${testLeadId}`, {
        status: 'contacted',
        next_followup_at: '2026-10-10'
    }, { headers: { 'X-Admin-Secret': adminPass } }).catch(e => console.error("Patch Error:", e.response?.data || e.message));

    // 3. Query DB for Timeline Events
    console.log("\n--- Timeline Events Query ---");
    const { data: activities } = await supabase
        .from('lead_activities')
        .select('activity_type, activity_description, created_at')
        .eq('lead_id', testLeadId)
        .order('created_at', { ascending: false })
        .limit(20);
    console.table(activities);

    // 4. Submit new B2B Lead
    const newLeadEmail = `test_b2b_${Date.now()}@example.com`;
    console.log(`\nSubmitting new B2B Lead: ${newLeadEmail}`);
    let newLeadRes;
    try {
        newLeadRes = await axios.post(`http://localhost:5000/api/b2b-inquiry`, {
            name: "Audit Test Corp",
            email: newLeadEmail,
            phone: "9999999999",
            company: "Audit Corp LLC",
            location: "Test City",
            products: "Bulk Orders",
            quantity: "500",
            notes: "We have a large budget for this year."
        });
    } catch(e) {
        console.error("B2B Submit Error:", e.response?.data || e.message);
    }
    
    // Get the new lead ID
    const { data: newLead } = await supabase.from('leads').select('id, lead_score, buying_intent, lead_quality, estimated_deal_size').eq('email', newLeadEmail).single();
    
    console.log("\n--- AI Results ---");
    console.log(JSON.stringify({
        lead_score: newLead.lead_score,
        buying_intent: newLead.buying_intent,
        lead_quality: newLead.lead_quality,
        estimated_deal_size: newLead.estimated_deal_size
    }, null, 2));

    console.log("\n--- New Lead Activity Events ---");
    const { data: newActivities } = await supabase
        .from('lead_activities')
        .select('activity_type, activity_description')
        .eq('lead_id', newLead.id);
    console.table(newActivities);
}

test();
