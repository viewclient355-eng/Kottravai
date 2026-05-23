const { GoogleGenerativeAI } = require("@google/generative-ai");
const supabase = require('../supabase');
const db = require('../db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// Governance: Embedding Version
const EMBEDDING_VERSION = "v1.2-enterprise";

/**
 * Synchronizes a single product with lifecycle governance.
 */
async function syncProductVector(productId) {
    try {
        const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
        const product = rows[0];

        if (!product || !product.is_live) {
            await deleteProductVector(productId);
            return;
        }

        const richContent = `
Product: ${product.name}
Category: ${product.category}
Description: ${product.short_description || ''} ${product.description || ''}
Features: ${(product.key_features || []).join(', ')}
Price: ₹${product.price}
URL: https://kottravai.in/product/${product.slug}
        `.trim();

        const result = await embeddingModel.embedContent(richContent);
        const embedding = result.embedding.values;

        // Governance: Metadata with versioning and sync trace
        const { error } = await supabase
            .from('knowledge')
            .upsert({
                content: richContent,
                metadata: {
                    product_id: product.id,
                    slug: product.slug,
                    type: 'product',
                    version: EMBEDDING_VERSION,
                    last_sync: new Date().toISOString()
                },
                embedding: embedding
            }, {
                onConflict: 'metadata->>product_id'
            });

        if (error) throw error;
        return true;
    } catch (err) {
        console.error(`❌ Sync Failure (${productId}):`, err.message);
        return false;
    }
}

/**
 * Removes stale or unpublished vectors.
 */
async function deleteProductVector(productId) {
    try {
        const { error } = await supabase
            .from('knowledge')
            .delete()
            .eq('metadata->product_id', productId);
        
        if (error) throw error;
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Full Lifecycle Sync: Refreshes all and purges orphans.
 */
async function fullVectorSync() {
    console.log("🏁 Starting Enterprise Lifecycle Sync...");
    const { rows: products } = await db.query('SELECT id FROM products WHERE is_live = TRUE');
    const liveIds = products.map(p => p.id);
    
    // 1. Refresh live products
    for (const p of products) {
        await syncProductVector(p.id);
        await new Promise(r => setTimeout(r, 300));
    }

    // 2. Governance: Purge orphaned vectors (Data Lifecycle)
    const { data: vectors, error } = await supabase
        .from('knowledge')
        .select('metadata');
    
    if (!error && vectors) {
        const orphans = vectors.filter(v => !liveIds.includes(v.metadata.product_id));
        for (const o of orphans) {
            await deleteProductVector(o.metadata.product_id);
            console.log(`🧹 Purged orphaned vector: ${o.metadata.product_id}`);
        }
    }
    
    console.log("✨ Enterprise Lifecycle Sync Complete.");
}

module.exports = { syncProductVector, deleteProductVector, fullVectorSync };
