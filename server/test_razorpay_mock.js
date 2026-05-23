// MOCK RAZORPAY TEST (Simulated Sandbox)
const axios = require('axios');

async function testMockOrder() {
    console.log("🧪 Testing Razorpay Integration Flow (Mocked)...");
    
    // Simulate what /api/razorpay/order does
    const orderData = {
        amount: 51,
        currency: 'INR',
        orderData: {
            customerName: "Test User",
            customerEmail: "test@example.com",
            customerPhone: "9876543210",
            address: "123 Test Street",
            city: "Test City",
            state: "Tamil Nadu",
            pincode: "600001",
            items: [{ id: "test-prod", name: "Sample Product", price: 51, quantity: 1 }]
        }
    };

    console.log("1. Sending order creation request to local server...");
    try {
        const response = await axios.post('http://localhost:5000/api/razorpay/order', orderData);
        console.log("✅ Order created effectively:", response.data.id);
    } catch (err) {
        console.error("❌ Failed to create order:", err.response?.data?.error || err.message);
        if (err.response?.status === 401) {
            console.warn("⚠️  This is because your RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is invalid.");
        }
    }
}

testMockOrder();
