require('dotenv').config();
const aiProvider = require('./services/aiProvider');

async function testAI() {
  try {
    console.log("Calling Primary Provider (Should be Groq)...");
    const response = await aiProvider.generateContent(
      'You are a JSON generating assistant. Always output JSON.',
      '{"hello": "world"}',
      []
    );
    console.log("Response:", response);
  } catch (err) {
    console.error("AI Error:", err.response?.data || err.message);
  }
}

testAI();
