const db = require('../db');

/**
 * Product Service for Thozhi AI
 * Consolidates product retrieval for both API and Chatbot execution
 */
let cachedProducts = null;
let lastFetch = 0;
const CACHE_DURATION = 60000; // 1 minute

class ProductService {
    async getAllActiveProducts() {
        const now = Date.now();
        if (cachedProducts && (now - lastFetch < CACHE_DURATION)) {
            console.log(`⚡ [PRODUCT_SERVICE] Serving ${cachedProducts.length} products from cache`);
            return cachedProducts;
        }

        try {
            console.log("📡 [PRODUCT_SERVICE] Fetching full catalog from PostgreSQL...");
            // Removed 'tags' as it doesn't exist in the schema. Using basic commerce fields.
            const result = await db.query(`
                SELECT id, name, category, description, price, images, original_id, is_live, is_best_seller, created_at
                FROM products
                WHERE is_live = true
                ORDER BY created_at DESC
            `);

            if (!result || !result.rows) {
                console.error("❌ [PRODUCT_SERVICE] Database query returned invalid result structure:", result);
                return cachedProducts || [];
            }

            // Step 2: Normalize Product Objects (Phase 11)
            const normalizedRows = result.rows.map(p => ({
                id: p.id,
                name: p.name || "Kottravai Product",
                category: p.category || "General",
                description: p.description || "",
                price: p.price,
                images: Array.isArray(p.images) ? p.images : [],
                original_id: p.original_id,
                is_best_seller: p.is_best_seller || false,
                created_at: p.created_at
            }));

            console.log(`✅ [PRODUCT_SERVICE] Successfully retrieved ${normalizedRows.length} active products`);
            
            if (normalizedRows.length > 0) {
                cachedProducts = normalizedRows;
                lastFetch = now;
            }
            return normalizedRows;
        } catch (err) {
            console.error("❌ [PRODUCT_SERVICE] Failed to fetch products:", {
                message: err.message,
                code: err.code,
                query: "SELECT ... FROM products"
            });
            // If cache exists, return stale data instead of empty array
            return cachedProducts || [];
        }
    }
}

module.exports = new ProductService();
