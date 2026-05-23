require('dotenv').config({ path: '../.env' });
const db = require('../db');

async function fixGstInDatabase() {
    console.log('🧪 [FIX] Recalculating and updating GST for all orders...');

    try {
        const ordersRes = await db.query('SELECT * FROM orders ORDER BY created_at ASC');
        const orders = ordersRes.rows;

        for (const order of orders) {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            const itemIds = items.map(i => i.id);
            
            // Get GST rates for products
            const productsRes = await db.query('SELECT id, gst_rate FROM products WHERE id = ANY($1)', [itemIds]);
            const products = productsRes.rows;

            let totalGst = 0;
            const enrichedItems = items.map(item => {
                const product = products.find(p => p.id === item.id);
                const gstRate = parseFloat(product ? product.gst_rate : 0);
                const itemGst = (parseFloat(item.price) * item.quantity) * (gstRate / 100);
                totalGst += itemGst;
                return { ...item, gst_rate: gstRate };
            });

            console.log(`✅ Order #${order.order_id}: Calculated GST = ₹${totalGst.toFixed(2)}`);

            await db.query(
                `UPDATE orders SET 
                    total_gst_server = $1, 
                    gst_server = $1,
                    items = $2 
                 WHERE id = $3`,
                [totalGst.toFixed(2), JSON.stringify(enrichedItems), order.id]
            );
        }

        console.log('🏁 [FIX] Database GST records updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ [FIX] Failed:', err.message);
        process.exit(1);
    }
}

fixGstInDatabase();
