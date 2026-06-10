const axios = require('axios');
require('dotenv').config();

async function testLead() {
  const payload = {
    name: 'Corporate Buyer',
    email: 'buyer@abc.com',
    company_name: 'ABC Pvt Ltd',
    source: 'b2b_inquiry',
    inquiry: 'Need 500 Diwali gift hampers for employees. Budget ₹5 lakhs. Need delivery in 2 weeks.'
  };

  try {
    console.log("Submitting B2B Lead to Backend Capture Endpoint...");
    const res = await axios.post('http://localhost:5000/api/leads/capture', payload);
    
    console.log("\n✅ Success!");
    console.log("Lead Score:", res.data.lead.lead_score);
    console.log("Priority:", res.data.lead.priority);
    console.log("Temperature:", res.data.lead.lead_temperature);
    console.log("Qualification Status:", res.data.lead.qualification_status);
    console.log("AI Summary:", res.data.lead.ai_summary);
    console.log("Next Action:", res.data.lead.ai_next_action);
    console.log("Reasoning:", res.data.lead.ai_reasoning);

  } catch (err) {
    console.error("Test failed:", err.response?.data || err.message);
  }
}

testLead();
