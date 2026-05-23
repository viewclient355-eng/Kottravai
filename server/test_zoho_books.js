require('dotenv').config();
const zohoBooksService = require('./services/zohoBooksService');

async function testZohoBooks() {
    console.log('🧪 Testing Zoho Books Integration...');
    
    const mockOrder = {
        orderId: 'TEST-ORDER-' + Date.now(),
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '9999999999',
        address: '123 Test Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        paymentId: 'pay_test_' + Date.now(),
        items: [
            {
                name: 'Test Product 1',
                price: 100,
                quantity: 2
            },
            {
                name: 'Test Product 2',
                price: 250,
                quantity: 1
            }
        ]
    };

    try {
        console.log('Step 1: Refreshing Access Token...');
        const token = await zohoBooksService.refreshAccessToken();
        console.log('✅ Access Token obtained');

        console.log('Step 2: Creating/Fetching Contact...');
        const contactId = await zohoBooksService.getOrCreateContact({
            name: mockOrder.customerName,
            email: mockOrder.customerEmail,
            phone: mockOrder.customerPhone,
            address: mockOrder.address,
            city: mockOrder.city,
            state: mockOrder.state,
            pincode: mockOrder.pincode
        });
        console.log('✅ Contact ID:', contactId);

        console.log('Step 3: Creating Invoice...');
        const invoice = await zohoBooksService.createInvoice(mockOrder);
        if (invoice) {
            console.log('✅ Invoice Created Successfully:', invoice.invoice_number);
            console.log('Invoice ID:', invoice.invoice_id);
        } else {
            console.log('❌ Invoice Creation Failed (returned null)');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testZohoBooks();
