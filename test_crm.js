import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jysymqntcnsfdfgexzzt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log("--- 8. Database Verification ---");
  // Get any lead
  let { data: leads } = await supabase.from('leads').select('*').limit(1);
  if (!leads || leads.length === 0) {
     console.log("No leads found.");
     return;
  }
  let lead = leads[0];
  console.log("LEAD BEFORE UPDATE:");
  console.log(JSON.stringify({ id: lead.id, status: lead.status, assigned_to: lead.assigned_to }, null, 2));

  // Update lead
  const { data: updatedLead, error: updateErr } = await supabase.from('leads')
    .update({ status: 'contacted', assigned_to: 'sarah', next_action: 'Send email' })
    .eq('id', lead.id)
    .select()
    .single();
    
  if (updateErr) console.error(updateErr);
  else {
    console.log("LEAD AFTER UPDATE:");
    console.log(JSON.stringify({ id: updatedLead.id, status: updatedLead.status, assigned_to: updatedLead.assigned_to, next_action: updatedLead.next_action }, null, 2));
  }

  // Insert Activity Note
  const { data: activity, error: actErr } = await supabase.from('lead_activities')
    .insert([{
        lead_id: lead.id,
        activity_type: 'Note Added',
        activity_description: 'TEST NOTE: Called the client today.',
        performed_by: null
    }])
    .select()
    .single();

  if (actErr) console.error(actErr);
  else {
    console.log("NEW LEAD ACTIVITY ROW:");
    console.log(JSON.stringify(activity, null, 2));
  }
}

verify();
