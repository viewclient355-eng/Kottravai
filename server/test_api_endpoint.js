const axios = require('axios');

async function testEndpoint() {
    try {
        console.log("Sending test product_view event...");
        const payload = {
            event_type: 'product_view',
            page: '/product/saree-xyz',
            page_url: 'http://localhost:5173/product/saree-xyz',
            timestamp: new Date().toISOString(),
            visitor_id: 'TEST_VISITOR_PROD',
            session_id: 'TEST_SESSION_PROD',
            metadata: { 
                product_name: "Test Saree XYZ",
                category: "Sarees",
                price: 1999,
                quantity: 1
            }
        };
        
        const response = await axios.post('http://localhost:5000/api/track/event', payload);
        console.log("Response Status:", response.status);
    } catch (e) {
        console.error("Error:", e.message);
    }
}
testEndpoint();
