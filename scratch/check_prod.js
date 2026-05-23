const db = require('../server/db');
async function checkProduct() {
    try {
        const slug = 'karuppu-ulunthu-idli-podi-100-g';
        const res = await db.query('SELECT name, slug, is_live FROM products WHERE slug = $1', [slug]);
        console.log('RESULT:', JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        process.exit();
    }
}
checkProduct();
