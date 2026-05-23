const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');

let baseUrl = process.env.VITE_API_URL || 'http://localhost:5000';
if (baseUrl === '/api' || !baseUrl.startsWith('http')) {
    baseUrl = 'http://localhost:5001';
}
const API_URL = `${baseUrl.replace(/\/api$/, '')}/api/chat`;

const TEST_CASES = [
    { name: "Greeting", query: "Hello Thozhi" },
    { name: "Specific Product", query: "I want a health mix for my 5 year old kid" },
    { name: "Vague Intent", query: "something nice" },
    { name: "Eco-friendly", query: "show me some sustainable bags" },
    { name: "Out of Catalog", query: "do you sell electronics like laptops?" }
];

async function runValidation() {
    console.log("🔍 Starting Thozhi AI Production Validation...");
    console.log(`📡 Target: ${API_URL}\n`);

    const results = [];

    for (const test of TEST_CASES) {
        process.stdout.write(`Testing [${test.name}]... `);
        const start = Date.now();
        try {
            const res = await axios.post(API_URL, { message: test.query });
            const duration = Date.now() - start;
            
            results.push({
                name: test.name,
                query: test.query,
                status: 'PASS',
                latency: duration,
                confidence: res.data.confidence,
                has_products: res.data.reply.includes('[PRODUCT:')
            });
            console.log("✅");
            // Add delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
            results.push({ name: test.name, query: test.query, status: 'FAIL', error: err.message });
            console.log("❌");
        }
    }

    console.log("\n--- VALIDATION REPORT ---");
    console.table(results);
    
    const passCount = results.filter(r => r.status === 'PASS').length;
    console.log(`\nFinal Score: ${passCount}/${TEST_CASES.length} Tests Passed`);
    
    if (passCount === TEST_CASES.length) {
        console.log("🚀 SYSTEM READY FOR PRODUCTION DEPLOYMENT.");
    } else {
        console.warn("⚠️ SOME TESTS FAILED. CHECK LOGS BEFORE LAUNCH.");
    }
}

runValidation();
