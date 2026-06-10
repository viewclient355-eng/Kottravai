const axios = require('axios');

async function testEndpoints() {
    const adminSecret = 'Admin!Kottravai2025%100';
    const headers = { 'X-Admin-Secret': adminSecret };

    console.log("Testing /api/products...");
    try {
        const res1 = await axios.get('http://localhost:5000/api/products', { headers });
        console.log("Products OK:", res1.data.length);
    } catch (e) {
        console.error("Products 500 Error:", e.response ? e.response.data : e.message);
    }

    console.log("\nTesting /api/orders...");
    try {
        const res2 = await axios.get('http://localhost:5000/api/orders', { headers });
        console.log("Orders OK:", res2.data.length);
    } catch (e) {
        console.error("Orders 500 Error:", e.response ? e.response.data : e.message);
    }
}

testEndpoints();
