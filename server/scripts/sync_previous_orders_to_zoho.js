require('dotenv').config({ path: '../.env' });
const db = require('../db');
const zohoBooksService = require('../services/zohoBooksService');

async function syncPreviousOrders() {
    console.log('🔄 [MIGRATION] Starting Zoho Books Sync for Previous Orders...');

    try {
        const token = await zohoBooksService.refreshAccessToken();
        const axios = require('axios');
        const taxRes = await axios.get('https://www.zohoapis.in/books/v3/settings/taxes', {
            headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
            params: { organization_id: process.env.ZOHO_BOOKS_ORGANIZATION_ID }
        });
        console.log('📋 Available Zoho Taxes:', JSON.stringify(taxRes.data.taxes.map(t => ({ name: t.tax_name, id: t.tax_id })), null, 2));

        // 1. Fetch all orders that don't have a zoho_invoice_id
        const ordersRes = await db.query('SELECT * FROM orders WHERE zoho_invoice_id IS NULL ORDER BY created_at ASC');
        const orders = ordersRes.rows;

        console.log(`📊 [MIGRATION] Found ${orders.length} orders to sync.`);

        for (const order of orders) {
            try {
                console.log(`➡️  Processing Order #${order.order_id} (DB ID: ${order.id})`);
                
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                
                // Fetch current GST rates for items
                const itemIds = items.map(i => i.id);
                const productsRes = await db.query('SELECT id, gst_rate FROM products WHERE id = ANY($1)', [itemIds]);
                const products = productsRes.rows;

                const enrichedItems = items.map(item => {
                    const product = products.find(p => p.id === item.id);
                    return {
                        ...item,
                        gst_rate: product ? product.gst_rate : 0
                    };
                });

                const invoice = await zohoBooksService.createInvoice({
                    customerName: order.customer_name,
                    customerEmail: order.customer_email,
                    customerPhone: order.customer_phone,
                    address: order.address,
                    city: order.city,
                    district: order.district,
                    state: order.state,
                    pincode: order.pincode,
                    total: order.total,
                    items: enrichedItems,
                    orderId: order.order_id,
                    paymentId: order.payment_id
                });

                if (invoice && invoice.invoice_id) {
                    await db.query(
                        "UPDATE orders SET zoho_invoice_id = $1 WHERE id = $2",
                        [invoice.invoice_id, order.id]
                    );
                    console.log(`✅ [SYNCED] Order #${order.order_id} -> Zoho Invoice: ${invoice.invoice_number}`);
                } else {
                    console.warn(`⚠️  [SKIPPED] Invoice could not be created for Order #${order.order_id}`);
                }

                // Small delay to avoid hitting Zoho rate limits
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (orderErr) {
                console.error(`❌ [ERROR] Failed to sync Order #${order.order_id}:`, orderErr.message);
            }
        }

        console.log('🏁 [MIGRATION] Sync completed.');
        process.exit(0);

    } catch (err) {
        console.error('💥 [CRITICAL_FAILURE] Migration failed:', err.message);
        process.exit(1);
    }
}

syncPreviousOrders();
