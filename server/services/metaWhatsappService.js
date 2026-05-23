const axios = require('axios');

/**
 * Sends a WhatsApp order confirmation message using Meta Cloud API
 * @param {string} phone - Recipient phone number (format: 9198xxxxxxx, no +)
 * @param {object} order - The order object containing id, items, and total
 */
const sendMetaWhatsAppOrderConfirmation = async (phone, order) => {
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        console.error('❌ WhatsApp Credentials missing in environment variables');
        return false;
    }

    try {
        // 1. Sanitize Phone Number: Ensure it starts with 91 and has no special characters
        let cleanPhone = phone.toString().replace(/\D/g, '');
        if (cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone; // Default to India prefix if missing
        }

        // 2. Parse items safely
        let itemsArray = [];
        try {
            itemsArray = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
        } catch (e) {
            console.error('⚠️ Could not parse order items for WhatsApp:', e.message);
        }

        // 3. Format items list: "Product Name xQty"
        const itemsList = itemsArray
            .map(item => `${item.name} x${item.quantity || 1}`)
            .join(', ');

        const displayTotal = order.total.toString();

        // 2. Prepare Meta API Request
        const response = await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: {
                messaging_product: 'whatsapp',
                to: cleanPhone,
                type: 'template',
                template: {
                    name: 'kottravai_order_confirm_v1',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: order.id.toString() }, // {{1}} = order_id
                                { type: 'text', text: itemsList },           // {{2}} = items list
                                { type: 'text', text: `₹${displayTotal}` }    // {{3}} = total amount
                            ]
                        }
                    ]
                }
            }
        });

        console.log(`✅ WhatsApp confirmation sent to ${cleanPhone}:`, response.data.messages[0]?.id);
        return true;

    } catch (error) {
        console.error('❌ WhatsApp API Error:', error.response?.data || error.message);
        // We log the error but don't throw it to prevent crashing the main order flow
        return false;
    }
};

module.exports = { sendMetaWhatsAppOrderConfirmation };
