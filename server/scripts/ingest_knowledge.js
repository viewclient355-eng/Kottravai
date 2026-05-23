require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../db');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 1. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function ingestKnowledge() {
    console.log("🚀 Starting Knowledge Ingestion (Gemini Edition)...");

    try {
        // 1. Fetch products from local DB
        const { rows: products } = await db.query('SELECT * FROM products WHERE is_live = TRUE');
        console.log(`📦 Found ${products.length} live products to process.`);

        for (const product of products) {
            console.log(`\nProcessing: ${product.name}`);

            // 2. Construct RICH content
            const intentHints = [];
            const name = product.name?.toLowerCase() || '';
            const cat = product.category?.toLowerCase() || '';
            const desc = ((product.short_description || '') + ' ' + (product.description || '')).toLowerCase();
            
            if (cat.includes('bag') || cat.includes('handicraft')) {
                intentHints.push("gift for mom", "gift for women", "birthday gift", "anniversary gift", "special occasion");
            }
            if (cat.includes('food') || cat.includes('health') || name.includes('mix') || name.includes('sathu')) {
                intentHints.push("healthy drink for kids", "nutrition for children", "kids health mix", "energy drink for kids", "growth support for kids", "nutritious drink");
            }

            const richContent = `
Product: ${product.name}
Category: ${product.category}
Description: ${product.short_description || ''} ${product.description || ''}
Features: ${(product.key_features || []).join(', ')}
Use Cases: ${intentHints.join(', ')}, sustainable gifting, eco-friendly lifestyle
Target Audience: kids, children, families, mothers, eco-conscious shoppers
Search Keywords: gift, drink, beverage, mix, health mix, children, kids, healthy, nutritious, for mom, for women
Price: ₹${product.price}
URL: https://kottravai.in/product/${product.slug}
            `.trim();

            console.log("📝 Generated Content Snapshot:", richContent.substring(0, 100) + "...");

            // 3. Generate Gemini Embedding
            const result = await embeddingModel.embedContent(richContent);
            const embedding = result.embedding.values;

            // 4. Upsert into Supabase Knowledge Table
            const { error } = await supabase
                .from('knowledge')
                .upsert({
                    content: richContent,
                    metadata: {
                        product_id: product.id,
                        slug: product.slug,
                        type: 'product'
                    },
                    embedding: embedding
                }, {
                    onConflict: 'content'
                });

            if (error) {
                console.error(`❌ Error ingesting ${product.name}:`, error.message);
                if (error.message.includes('dimension')) {
                    console.error("⚠️ DIMENSION MISMATCH: You may need to update the 'knowledge' table embedding column to vector(768).");
                }
            } else {
                console.log(`✅ Successfully ingested ${product.name}`);
            }
        }

        console.log("\n✨ Gemini Ingestion complete!");
        process.exit(0);
    } catch (err) {
        console.error("💥 Critical Failure:", err);
        process.exit(1);
    }
}

ingestKnowledge();
