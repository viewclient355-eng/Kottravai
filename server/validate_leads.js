const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const adminSecret = "Admin!Kottravai2025%100"; // The correct admin password
const SERVER_URL = 'http://localhost:5000';

async function runTests() {
  console.log("====================================");
  console.log("STARTING E2E VALIDATION - POST MIGRATION");
  console.log("====================================\n");

  const results = {
    csvExport: false,
    contactForm: false,
    b2bForm: false,
    emailAck: false,
    utmTracking: false,
    dashboard: false,
  };

  try {
    // 1. Test Contact Form Insert
    console.log("--- 2. CONTACT FORM TEST ---");
    const contactRes = await supabase.from('leads').insert({
      name: 'Test Contact',
      email: 'contact@test.com',
      phone: '9999999999',
      source: 'contact_form',
      inquiry: 'Looking for corporate gifting solutions.',
      lead_type: 'corporate_gifting', 
      priority: 'high',
      lead_score: 30
    });

    if (contactRes.error) {
      console.error("❌ Contact Form Insert Failed:", contactRes.error);
    } else {
      console.log("✅ Lead inserted successfully.");
      results.contactForm = true;
    }

    // 2. Test B2B Form Insert
    console.log("\n--- 3. B2B FORM TEST ---");
    const b2bRes = await supabase.from('leads').insert({
      name: 'Corporate Buyer',
      email: 'buyer@test.com',
      company_name: 'Test Company',
      source: 'b2b_inquiry',
      inquiry: 'Need 500 Diwali gift hampers',
      lead_type: 'corporate_gifting',
      priority: 'high',
      lead_score: 50
    });

    if (b2bRes.error) {
      console.error("❌ B2B Form Insert Failed:", b2bRes.error);
    } else {
      console.log("✅ B2B Lead inserted successfully.");
      results.b2bForm = true;
    }

    // 3. UTM Tracking Test
    console.log("\n--- 5. UTM TRACKING TEST ---");
    const utmRes = await supabase.from('leads').insert({
      name: 'UTM Test User',
      email: 'utm@test.com',
      source: 'newsletter',
      lead_type: 'general',
      priority: 'medium',
      lead_score: 10,
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'diwali_test'
    });

    if (utmRes.error) {
      console.error("❌ UTM Tracking Insert Failed:", utmRes.error);
    } else {
      console.log("✅ UTM values stored correctly.");
      results.utmTracking = true;
    }

    // 4. Admin API & CSV Test
    console.log("\n--- 1. CSV EXPORT & 6. DASHBOARD VALIDATION ---");
    try {
      const adminRes = await axios.get(`${SERVER_URL}/api/admin/leads`, {
        headers: { "X-Admin-Secret": adminSecret }
      });
      
      if (adminRes.data && adminRes.data.success) {
        console.log("✅ Admin API returned successfully.");
        console.log("Dashboard KPIs:", JSON.stringify(adminRes.data.stats, null, 2));
        results.dashboard = true;
      } else {
        console.error("❌ Admin API Failed:", adminRes.data);
      }

      const csvRes = await axios.get(`${SERVER_URL}/api/admin/leads/export?token=${encodeURIComponent(adminSecret)}`);
      if (csvRes.status === 200 && csvRes.headers['content-type'].includes('csv')) {
        console.log("✅ CSV Export Endpoint successful.");
        console.log("CSV Snippet:\n", csvRes.data.substring(0, 200) + '...');
        results.csvExport = true;
      } else {
        console.error("❌ CSV Export Endpoint Failed.", csvRes.status);
      }
    } catch (apiError) {
      console.error("❌ Server endpoints unreachable. Is the server running?", apiError.message);
    }

    // 5. Email ACK Test 
    console.log("\n--- 4. EMAIL ACKNOWLEDGEMENT TEST ---");
    try {
      const emailRes = await axios.post(`${SERVER_URL}/api/contact`, {
        name: 'Email Test',
        email: 'test@example.com',
        subject: 'Contact from Email Test',
        message: 'Testing email ack',
        _ack_only: true
      });
      console.log("✅ Email ACK API successful:", emailRes.data);
      results.emailAck = true;
    } catch (emailErr) {
      console.error("❌ Email ACK failed:", emailErr.message);
    }

    // Cleanup
    const adminSupabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    await adminSupabase.from('leads').delete().in('email', ['contact@test.com', 'buyer@test.com', 'utm@test.com']);

  } catch (err) {
    console.error("Unexpected error:", err);
  }

  console.log("\n====================================");
  console.log("VALIDATION SUMMARY:");
  console.log("====================================");
  console.log(JSON.stringify(results, null, 2));
}

runTests();
