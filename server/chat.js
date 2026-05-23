const express = require('express');
const router = express.Router();
const supabase = require('./supabase');
const crypto = require('crypto');
const { trackRagInteraction } = require('./thozhi_monitoring');
const { embeddingCache, responseCache, normalizeQuery, getCacheKey } = require('./utils/aiCache');
const aiProvider = require('./services/aiProvider');
const productService = require('./services/productService');
const chatAnalytics = require('./services/chatAnalytics');
const aiMonitoring = require('./utils/aiMonitoring');
const userPreferenceService = require('./services/userPreferenceService');

// --- Phase 10 Trace & Diagnostics ---
const MAX_CONCURRENT = 20;
let activeRequests = 0;
const conversationalState = new Map();

// --- Memory Cleanup (Phase 11) ---
const cleanupOldSessions = () => {
    const now = Date.now();
    for (const [sid, state] of conversationalState.entries()) {
        if (now - state.lastTimestamp > 1800000) { // 30 minutes
            conversationalState.delete(sid);
        }
    }
};
setInterval(cleanupOldSessions, 600000); // Run every 10 minutes

// --- Refinement Patterns ---
const refinementPatterns = [
  "something cheaper",
  "something better",
  "show another",
  "another one",
  "less expensive",
  "premium option",
  "more affordable",
  "budget option",
  "show more",
  "better quality",
  "cheaper",
  "more expensive",
  "anything else"
];

// --- Semantic Category Mappings (Phase 11) ---
const categoryMappings = {
  bathroom: ["home essentials", "wellness", "household", "bath care"],
  soap: ["wellness", "bath care", "essential care"],
  kitchen: ["cookware", "home", "heritage mixes"],
  gift: ["curated", "special occasion", "hampers", "handicrafts"],
  kids: ["children", "family", "health mixes"],
  wellness: ["essential care", "health mixes"],
  home: ["household", "handicrafts"]
};

const STOP_WORDS = [
  "can", "could", "would", "should", "please", "show", "give", "get", "find", 
  "need", "want", "looking", "search", "for", "some", "any", "me", "i", "we", 
  "our", "the", "a", "an", "is", "are", "with", "to", "today", "suggest", 
  "recommend", "tell", "about", "products", "items"
];

const PRICE_INTENTS = {
  cheapest: ["cheap", "cheaper", "lowest", "budget", "low price", "affordable", "less price", "value"],
  expensive: ["premium", "expensive", "luxury", "costly", "high price", "best quality"]
};

const CATEGORY_DOMAINS = {
  food: ["mix", "health", "drink", "millet", "rice", "idly", "idli", "dosa", "podi", "heritage mixes", "breakfast", "spices", "sathu maavu", "masala"],
  jewellery: ["jewellery", "necklace", "earrings", "bangles", "temple jewellery", "jewelry", "fashion"],
  decor: ["decor", "home", "art", "terracotta", "wall", "craft"],
  gifts: ["gift", "hamper", "hampers", "present", "combo", "bundle", "gift box", "gift combo", "eco hampers", "premium gifts"]
};

const TRENDING_INTENTS = {
  trending: ["trending", "popular", "best seller", "best selling", "favorites", "most loved"],
  newest: ["new", "latest", "recent", "fresh", "new arrivals"]
};

const LIFESTYLE_FRAMING = {
  food: "These products are popular among customers looking for healthy breakfast alternatives.",
  gifts: "These handcrafted gifts are often chosen for festive and return-gift occasions.",
  jewellery: "These traditional products are loved for their homemade-style authenticity."
};

const synonymMap = {
  idly: ["idly", "idli", "podi", "powder", "mix"],
  dosa: ["dosa", "dosai"],
  spice: ["spice", "masala", "spices", "turmeric", "pepper"],
  gift: ["gift", "hamper", "present", "combo", "bundle"],
  healthy: ["healthy", "organic", "natural", "wellness", "nutrition"],
  terracotta: ["terracotta", "jewellery", "jewelry"]
};

// --- Conversational Marketing Personality (Phase 11) ---
const CONVERSATIONAL_TEMPLATES = {
  food: [
    "These traditional mixes are popular for quick homemade meals and healthy breakfasts.",
    "Many customers love these heritage mixes for their authentic homemade-style taste.",
    "These mixes are a great choice if you enjoy traditional and healthy food options."
  ],
  gifts: [
    "These hampers are popular for thoughtful gifting and festive occasions.",
    "If you're looking for meaningful eco-friendly gifts, these are worth exploring.",
    "These curated hampers are customer favorites for birthdays and celebrations."
  ],
  jewellery: [
    "These handcrafted jewellery collections are among our premium traditional designs.",
    "Customers love these pieces for their elegant handmade finish and cultural touch.",
    "These jewellery products are perfect if you enjoy traditional handcrafted styles."
  ],
  general: [
    "These are some customer favorites you might enjoy exploring.",
    "Here are some of our most loved traditional products curated just for you.",
    "I've picked out a few items from our collection that reflect Kottravai's handmade identity."
  ]
};

const FOLLOW_UP_PHRASES = {
  pricing: "Would you like budget-friendly options or premium picks?",
  variety: "Would you like to explore similar products or gift combos?",
  interest: "Would you like recommendations based on healthy options, gifting, or traditional foods?",
  general: "Should I show you more varieties from this collection?"
};

const RESTRICTED_QUERIES = [
  "analytics", "revenue", "profit", "sales metrics", "dashboard", 
  "database", "internal", "admin", "api", "logs", "system", 
  "performance", "latency", "secret", "confidential", "company data", 
  "business metrics", "conversion rate", "financial", "orders count", 
  "supplier", "backend", "server", "token", "api key", "credentials"
];

const SAFE_REDIRECTIONS = [
  "I’m mainly here to help you explore Kottravai products and collections.",
  "I can help you discover healthy mixes, eco-friendly gifts, handcrafted jewellery, and traditional products.",
  "For shopping recommendations and product discovery, I’d be happy to help."
];

router.post('/', async (req, res) => {
    console.log("\n🚀 [RCA] REQUEST_RECEIVED:", req.body.message);
    const startTime = Date.now();
    const { message, history = [], sessionId = 'anonymous' } = req.body;
    
    if (activeRequests >= MAX_CONCURRENT) {
        console.error("❌ [RCA] CONCURRENCY_EXCEEDED");
        return res.status(530).json({ error: "System optimizing. Try again." });
    }
    activeRequests++;

    const normalized = normalizeQuery(message);
    console.log("✅ [RCA] QUERY_NORMALIZED:", normalized);
    const cacheKey = getCacheKey(normalized);

    let context = "";
    let similarityScores = [];
    let fallbackUsed = false;
    let confidenceLevel = "LOW";
    let intent = 'discovery';
    let matchedProductIds = [];
    let detectedCategory = null;
    let fallbackUsage = false;

    // 1. Refinement Intelligence (Phase 11)
    const isRefinementQuery = refinementPatterns.some(p => normalized.includes(p));
    const sessionState = conversationalState.get(sessionId) || null;

    if (isRefinementQuery) {
        console.log("🔍 [REFINEMENT] REFINEMENT_INTENT_DETECTED");
        console.log("🔍 [REFINEMENT] ANCHOR_FOUND:", !!sessionState);
        
        if (!sessionState) {
            console.log("🔍 [REFINEMENT] CLARIFICATION_TRIGGERED");
            activeRequests--;
            return res.json({ 
                reply: "I'd love to help you find something specific! Are you looking for health mixes, eco-friendly gifts, traditional spices, or something else?",
                confidence: "HIGH",
                clarification_needed: true
            });
        }
        intent = 'refinement';
    }

    try {
        // 1. Intent Intelligence
        if (normalized.includes('buy') || normalized.includes('price')) intent = 'transactional';
        else if (normalized.includes('how') || normalized.includes('what')) intent = 'informational';

        // 2. Cache Check
        if (history.length === 0 && responseCache.has(cacheKey)) {
            console.log("⚡ [RCA] RESPONSE_CACHE_HIT");
            activeRequests--;
            return res.json({ ...responseCache.get(cacheKey), cached: true });
        }

        // 2.5 Greeting Bypass (Phase 11 Optimization)
        const greetings = ["hi", "hello", "hey", "hii", "good morning", "good evening", "thozhi", "vanakkam"];
        if (greetings.some(g => normalized.includes(g) && normalized.length < 15)) {
            console.log("⚡ [RCA] GREETING_BYPASS_TRIGGERED");
            const reply = "Vanakkam! I'm Thozhi, your Kottravai assistant. I'm here to help you discover authentic traditional foods, handcrafted jewellery, and thoughtful eco-friendly gifts. What can I help you find today?";
            activeRequests--;
            return res.json({ reply, confidence: "HIGH" });
        }

        // 2.6 Hard Security Boundaries (Phase 12 Security)
        const isRestrictedQuery = RESTRICTED_QUERIES.some(keyword => normalized.includes(keyword));
        if (isRestrictedQuery) {
            console.log("🔒 RESTRICTED_QUERY_BLOCKED", {
                query: normalized,
                timestamp: Date.now(),
                sessionId
            });

            // Log security attempt
            chatAnalytics.logRestrictedQuery({
                sessionId,
                query: message,
                blockedReason: 'restricted_intent_match'
            });

            const reply = SAFE_REDIRECTIONS[Math.floor(Math.random() * SAFE_REDIRECTIONS.length)];
            activeRequests--;
            return res.json({ 
                reply, 
                confidence: "HIGH", 
                intelligence: { intent: 'restricted', security_blocked: true } 
            });
        }

        const filters = { category: sessionState?.lastCategory || null };
        if (normalized.includes('bag')) filters.category = 'Handicrafts/Bags';
        if (normalized.includes('food')) filters.category = 'Heritage Mixes';

        // Apply Semantic Category Mapping (Phase 11)
        let augmentedQuery = message;
        for (const [key, synonyms] of Object.entries(categoryMappings)) {
            if (normalized.includes(key)) {
                console.log("🔍 [SEMANTIC] CATEGORY_MAPPING_APPLIED:", key);
                augmentedQuery += " " + synonyms.join(" ");
                break; 
            }
        }

        // Price refinement logic
        let priceFilter = null;
        if (isRefinementQuery) {
            if (normalized.includes('cheaper') || normalized.includes('less expensive') || normalized.includes('budget')) {
                priceFilter = 'low';
            } else if (normalized.includes('premium') || normalized.includes('better')) {
                priceFilter = 'high';
            }
        }
        
        // 2.7 Deterministic Matching Layer (Phase 11)
        console.log("🔍 [HYBRID] MATCH_STARTED");
        console.log("🔍 [HYBRID] NORMALIZED_QUERY:", normalized);
        
        const allProducts = await productService.getAllActiveProducts();

        if (!Array.isArray(allProducts)) {
            console.error("❌ [HYBRID] allProducts is not an array");
            activeRequests--;
            return res.status(500).json({ error: "Product dataset unavailable" });
        }

        console.log("📦 PRODUCT_COUNT:", allProducts.length);

        // Step 4: Validate Product Structure (Phase 11)
        allProducts.forEach(p => {
            if (!p.id || !p.name) console.warn("⚠️ [HYBRID] MALFORMED_PRODUCT:", p);
        });

        // Step 6: Emergency Product Dataset Protection (Phase 11)
        if (allProducts.length === 0) {
            console.error("❌ [HYBRID] CHAT_PRODUCT_DATASET_EMPTY");
            fallbackUsed = true;
            context = "NOTICE: Product catalog is currently unavailable. Guide the user to browse Health Mixes and Gifts on our website.";
        }

        // Step 0: Normalize & Tokenize (Phase 11)
        const userQuery = message.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
        const queryTokens = userQuery.split(" ").filter(word => word.length > 1 && !STOP_WORDS.includes(word));
        const expandedTokens = queryTokens.flatMap(token => synonymMap[token] || [token]);
        const cleanedIntent = queryTokens.join(" ");

        // Step 1: Detect Category Domain (Phase 11)
        const detectedDomain = Object.entries(CATEGORY_DOMAINS).find(([domain, keywords]) => 
            keywords.some(keyword => normalized.includes(keyword))
        )?.[0];

        // Step 1.1: Context Reset Logic (Phase 11)
        const previousDomain = sessionState?.lastDomain || null;
        if (detectedDomain && previousDomain && detectedDomain !== previousDomain) {
            console.log("🧠 CATEGORY_OVERRIDE:", { previousDomain, detectedDomain });
            // The new domain intent overrides previous history
            context = ""; // Clear old RAG context
        }

        // Step 2: Detect Pricing Intent (Phase 11)
        const isCheapestQuery = PRICE_INTENTS.cheapest.some(keyword => userQuery.includes(keyword));
        const isPremiumQuery = PRICE_INTENTS.expensive.some(keyword => userQuery.includes(keyword)) || 
                               normalized.includes("highest price") || 
                               normalized.includes("most expensive");

        // Step 2.1: Detect Trending/Newest Intent (Phase 11)
        const isTrendingQuery = TRENDING_INTENTS.trending.some(keyword => userQuery.includes(keyword));
        const isNewestQuery = TRENDING_INTENTS.newest.some(keyword => userQuery.includes(keyword));
        
        // Step 3: Hard Negative Filters (Phase 11)
        const forbiddenTerms = detectedDomain === 'food' ? ["necklace", "jewellery", "earrings", "bangles", "fashion", "temple jewelry"] : [];

        console.log("🧠 PRICE_INTENT:", isCheapestQuery ? "CHEAPEST" : (isPremiumQuery ? "PREMIUM" : "NONE"));
        console.log("🧠 TRENDING_INTENT:", isTrendingQuery ? "TRENDING" : (isNewestQuery ? "NEWEST" : "NONE"));

        // Fetch User Preferences (Phase 13)
        const userPreferences = await userPreferenceService.getPreferences(sessionId);
        console.log("🧠 USER_PREFERENCES_LOADED:", !!userPreferences);

        const safeText = (val) => typeof val === "string" ? val.toLowerCase() : "";

        // Step 4: Restricted Matching & Boosting (Phase 13)
        let deterministicMatches = allProducts.map(p => {
            const name = safeText(p.name);
            const category = safeText(p.category);
            const description = safeText(p.description);
            const searchableText = `${name} ${category} ${description}`;
            
            let score = 0;
            
            // Hard Domain Locking
            if (detectedDomain === 'food') {
                const isFoodCategory = category.includes("mix") || category.includes("food") || category.includes("health") || category.includes("spice");
                if (!isFoodCategory) return { ...p, score: -1 }; // Hard Lock
                
                // Boost Food Specifics
                if (searchableText.includes("health mix") || searchableText.includes("heritage mix") || searchableText.includes("podi")) score += 10;
            }

            // Negative Filters
            if (forbiddenTerms.some(term => searchableText.includes(term))) {
                return { ...p, score: -1 };
            }

            // Direct Intent Match
            if (cleanedIntent.length > 2 && searchableText.includes(cleanedIntent)) {
                score += 5;
            }

            // Token/Synonym Based Matching
            expandedTokens.forEach(token => {
                if (token.length > 2 && searchableText.includes(token)) {
                    score += 1;
                }
            });

            return { ...p, score };
        })
        .filter(p => p.score > 0);

        // Apply Behavioral Boosting (Phase 13)
        deterministicMatches = userPreferenceService.boostProductScores(deterministicMatches, userPreferences);

        // Deterministic Sorting (Price, Trending, Newest)
        if (isCheapestQuery) {
            console.log("⚖️ [HYBRID] SORTING_BY_LOW_PRICE");
            deterministicMatches.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        } else if (isPremiumQuery) {
            console.log("⚖️ [HYBRID] SORTING_BY_HIGH_PRICE");
            deterministicMatches.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        } else if (isTrendingQuery) {
            console.log("⚖️ [HYBRID] SORTING_BY_TRENDING");
            // Personalized Trending: If trending within preferred category, boost it (handled by boostProductScores above)
            deterministicMatches.sort((a, b) => (b.is_best_seller ? 1 : 0) - (a.is_best_seller ? 1 : 0) || b.score - a.score);
        } else if (isNewestQuery) {
            console.log("⚖️ [HYBRID] SORTING_BY_NEWEST");
            deterministicMatches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at) || b.score - a.score);
        } else {
            deterministicMatches.sort((a, b) => b.score - a.score);
        }

        const topMatches = deterministicMatches.slice(0, 3);
        
        console.log("✅ [HYBRID] MATCH_COUNT:", topMatches.length);
        console.log("✅ [HYBRID] FINAL_PRODUCTS:", topMatches.map(p => ({ name: p.name, category: p.category, score: p.score })));

        // Step 5: Smart Conversational Responses (Phase 11)
        if (topMatches.length > 0) {
            console.log("🔗 [HYBRID] RETURNING_COMPARATIVE_RESULTS (Bypassing Gemini)");
            activeRequests--;
            
            // Pick a warm, conversational intro
            const templates = CONVERSATIONAL_TEMPLATES[detectedDomain] || CONVERSATIONAL_TEMPLATES.general;
            const intro = templates[Math.floor(Math.random() * templates.length)];
            
            // Add Lifestyle Framing
            const framing = LIFESTYLE_FRAMING[detectedDomain] || "";

            // Behavioral Intro (Phase 13)
            const behavioralIntro = userPreferenceService.getBehavioralIntro(userPreferences, detectedDomain);
            const finalIntro = behavioralIntro || intro;
            
            // Smart Commerce Suggestions
            let suggestion = "";
            if (detectedDomain === 'gifts' || detectedDomain === 'food') {
                suggestion = "\nYou might also like to explore our curated combos or customer favorites for more options.";
                // Add Cross-Selling Suggestions (Phase 13)
                if (detectedDomain === 'food' && normalized.includes('podi')) suggestion += "\nMany customers also enjoy our traditional dosa mixes and healthy breakfast drinks with these mixes.";
                if (detectedDomain === 'gifts') suggestion += "\nYou can also pair these with our handcrafted eco-friendly products for a complete gifting experience.";
            }

            // Pick a persuasive follow-up
            let followUp = FOLLOW_UP_PHRASES.general;
            if (isCheapestQuery || isPremiumQuery) followUp = FOLLOW_UP_PHRASES.pricing;
            else if (detectedDomain === 'gifts') followUp = FOLLOW_UP_PHRASES.variety;
            else if (detectedDomain === 'food') followUp = FOLLOW_UP_PHRASES.interest;
            
            const productTags = topMatches.map(p => `[PRODUCT:${p.id}]`).join('\n');
            
            // Save state for next turn
            conversationalState.set(sessionId, {
                lastDomain: detectedDomain || previousDomain,
                lastTimestamp: Date.now()
            });

            matchedProductIds = topMatches.map(p => p.id);
            detectedCategory = detectedDomain;

            // Update user preference memory (Phase 13)
            userPreferenceService.updatePreferences(sessionId, {
                preferredCategory: detectedCategory,
                pricingTendency: isCheapestQuery ? 'budget' : (isPremiumQuery ? 'premium' : null),
                exploredProductId: matchedProductIds[0]
            });

            // Log Interaction
            const responseLatency = Date.now() - startTime;
            aiMonitoring.trackLatency(responseLatency);
            chatAnalytics.logInteraction({
                sessionId,
                userQuery: message,
                normalizedIntent: intent,
                detectedCategory: detectedCategory,
                matchedProducts: matchedProductIds,
                responseLatency,
                fallbackUsage: false,
                pricingIntent: isCheapestQuery ? 'cheapest' : (isPremiumQuery ? 'premium' : 'standard'),
                conversationalDomain: detectedDomain
            });

            return res.json({
                reply: `${finalIntro}\n\n${framing}\n\n${productTags}\n${suggestion}\n\n${followUp}`,
                confidence: "HIGH",
                intelligence: { 
                    intent: isCheapestQuery || isPremiumQuery ? 'comparative' : 'deterministic', 
                    success_score: 1.0, 
                    price_sorted: isCheapestQuery || isPremiumQuery,
                    domain: detectedDomain
                }
            });
        }

        // Step 4: Deterministic Category Fallback (Phase 11)
        const isCommerceQuery = queryTokens.some(token => 
            ["mix", "powder", "gift", "kitchen", "spice", "drink", "soap", "oil", "food", "healthy"].includes(token)
        );

        if (isCommerceQuery) {
            console.log("⚠️ [HYBRID] COMMERCE_FALLBACK_TRIGGERED (Bypassing Gemini)");
            activeRequests--;

            chatAnalytics.logFailure({
                sessionId,
                originalQuery: message,
                cleanedIntent,
                detectedDomain: detectedDomain || 'general',
                failureReason: 'zero_matches'
            });

            return res.json({
                reply: "I couldn't find exact matches for those items right now, but I can help you explore our popular collections like Health Mixes, Eco-friendly Gifts, or Handcrafted Jewellery. What would you like to see?",
                confidence: "LOW",
                intelligence: { intent: 'fallback', success_score: 0.5 }
            });
        }

        // 3. Embedding Trace
        let queryEmbedding;
        const embCacheKey = `emb:${normalizeQuery(augmentedQuery)}`;
        if (embeddingCache.has(embCacheKey)) {
            console.log("⚡ [RCA] EMBEDDING_CACHE_HIT");
            queryEmbedding = embeddingCache.get(embCacheKey);
        } else {
            console.log("🔄 [RCA] GENERATING_EMBEDDING...");
            queryEmbedding = await aiProvider.getEmbedding(augmentedQuery);
            console.log("✅ [RCA] EMBEDDING_GENERATED");
            embeddingCache.set(embCacheKey, queryEmbedding);
        }

        // 4. Vector Retrieval Trace
        console.log("📡 [RCA] VECTOR_SEARCH_STARTED");
        const { data: matches, error: matchError } = await supabase.rpc('match_knowledge', {
            query_embedding: queryEmbedding,
            match_threshold: filters.category ? 0.22 : 0.32,
            match_count: 10
        });
        
        if (matchError) {
            console.error("❌ [RCA] VECTOR_SEARCH_FAILURE:", matchError.message);
            throw matchError;
        }
        console.log("✅ [RCA] VECTOR_RESULTS_COUNT:", matches?.length || 0);

        let filteredMatches = matches || [];
        const hasMatches = filteredMatches.length > 0;
        const avgSimilarity = hasMatches 
            ? filteredMatches.reduce((sum, m) => sum + m.similarity, 0) / filteredMatches.length 
            : 0;

        console.log(`📊 [SEMANTIC] ANALYSIS: hasMatches=${hasMatches}, avgSimilarity=${avgSimilarity.toFixed(3)}`);

        if (hasMatches && avgSimilarity > 0.35) {
            const seen = new Set();
            filteredMatches = filteredMatches.map(m => {
                let boost = 0;
                if (filters.category && m.content.includes(filters.category)) boost += 0.12;
                
                // Price Refinement Boost (Phase 11)
                if (priceFilter === 'low') {
                    if (m.content.match(/₹[0-4][0-9]{2}/)) boost += 0.15;
                    if (m.content.match(/price:.*(low|budget|affordable)/i)) boost += 0.1;
                } else if (priceFilter === 'high') {
                    if (m.content.match(/₹[1-9][0-9]{3}/)) boost += 0.15;
                }

                return { ...m, similarity: m.similarity + boost };
            }).filter(m => {
                const id = m.metadata?.product_id;
                if (!id || seen.has(id)) return false;
                seen.add(id); return true;
            }).sort((a, b) => b.similarity - a.similarity);

            const topScore = filteredMatches[0]?.similarity || 0;
            confidenceLevel = topScore > 0.68 ? "HIGH" : (topScore > 0.45 ? "MEDIUM" : "LOW");
            context = filteredMatches.slice(0, 4).map(m => m.content).join("\n\n");
            similarityScores = filteredMatches.map(m => ({ score: m.similarity.toFixed(3) }));

            // Update Conversational Anchor
            const topMatch = filteredMatches[0];
            const detectedCategory = topMatch.metadata?.category || filters.category;
            
            conversationalState.set(sessionId, {
                lastCategory: detectedCategory,
                lastProducts: filteredMatches.slice(0, 3).map(m => m.metadata?.product_id),
                lastQuery: normalized,
                lastTimestamp: Date.now()
            });
            console.log("💾 [SEMANTIC] ANCHOR_UPDATED:", detectedCategory);
        } else {
            console.log("⚠️ [SEMANTIC] SEMANTIC_NO_MATCH_OR_WEAK_RETRIEVAL");
            // Step 8: Emergency Semantic Fallback (Bypass AI if retrieval fails completely)
            activeRequests--;
            return res.json({
                reply: "I couldn't find exact matches, but I can help you explore our similar collections. Are you interested in our healthy mixes, handmade gifts, or traditional jewellery?",
                confidence: "LOW",
                intelligence: { intent: 'fallback', success_score: 0.5 }
            });
        }

        // 5. Provider Execution Trace
        console.log("📝 [RCA] PROMPT_CONSTRUCTED. Intent:", intent);
        let systemPrompt = `You are Thozhi, the warm and helpful AI assistant for Kottravai. 
Kottravai is a brand that celebrates traditional, handmade, and eco-friendly products from Tamil Nadu.

Your personality:
- Warm and welcoming (use "Vanakkam" or "Hi there").
- Culturally rooted but modern.
- Helpful and softly persuasive, like a knowledgeable local shopkeeper.
- Professional but never robotic.

Context for this interaction:
- Intent: ${intent}
- Confidence: ${confidenceLevel}
- Related Products: ${context || "No exact matches in catalog."}
- Last Category Seen: ${sessionState?.lastCategory || "None"}

Guidelines:
1. If products are found, introduce them warmly. Use phrases like "I've picked out some favorites for you" or "You might enjoy these traditional collections."
2. If no exact matches are found, don't just say "No products found." Instead, say "I couldn't find exact matches for those, but I can help you explore our popular collections like Health Mixes or Eco-friendly Gifts."
3. Always frame products in a lifestyle context (e.g., healthy breakfast, thoughtful gifting, authentic homemade taste).
4. Keep responses concise and focused on helping the user discover products.
5. Use [PRODUCT:id] tags for any products you mention from the context.`;
        
        console.log("📡 [RCA] CALLING_PROVIDER...");
        const result = await aiProvider.generateContent(systemPrompt, message, history.slice(-8));
        console.log("✅ [RCA] PROVIDER_RESPONSE_RECEIVED. Provider:", result.provider);

        const responseText = result.text;
        let finalReply = responseText;

        // Ensure Product Visibility (Phase 11)
        if (deterministicMatches.length > 0 && !responseText.includes('[PRODUCT:')) {
            console.log("🔗 [HYBRID] INJECTING_DETERMINISTIC_TAGS");
            const tags = deterministicMatches.map(p => `[PRODUCT:${p.id}]`).join('\n');
            finalReply = `${responseText}\n\nHere are some related products you might like:\n${tags}`;
        }

        const response = { 
            reply: finalReply, 
            confidence: confidenceLevel, 
            intelligence: { intent, success_score: 1.0 } 
        };
        
        console.log("🏁 [RCA] FINAL_RESPONSE_SENT");
        const responseLatency = Date.now() - startTime;
        aiMonitoring.trackLatency(responseLatency);
        
        chatAnalytics.logInteraction({
            sessionId,
            userQuery: message,
            normalizedIntent: intent,
            detectedCategory: sessionState?.lastCategory,
            matchedProducts: matchedProductIds,
            responseLatency,
            fallbackUsage,
            pricingIntent: 'standard',
            conversationalDomain: sessionState?.lastDomain
        });

        res.json(response);

    } catch (err) {
        activeRequests--;
        console.error("💥 [RCA] CHAT_RUNTIME_CRASH");
        console.error("MESSAGE:", err.message);
        console.error("STACK:", err.stack);
        console.error("RAW_ERROR:", err);

        res.status(500).json({ 
            reply: "I'm having a little trouble right now. Please try again or refine your question." 
        });
    }
});

module.exports = router;