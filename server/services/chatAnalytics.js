const db = require('../db');

class ChatAnalyticsService {
    async logInteraction(data) {
        const {
            sessionId,
            userQuery,
            normalizedIntent,
            detectedCategory,
            matchedProducts,
            responseLatency,
            fallbackUsage,
            pricingIntent,
            conversationalDomain
        } = data;

        try {
            await db.query(`
                INSERT INTO chat_analytics_logs (
                    session_id, user_query, normalized_intent, detected_category, 
                    matched_products, response_latency, fallback_usage, 
                    pricing_intent, conversational_domain
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                sessionId, userQuery, normalizedIntent, detectedCategory, 
                JSON.stringify(matchedProducts || []), responseLatency, 
                fallbackUsage, pricingIntent, conversationalDomain
            ]);
        } catch (err) {
            console.error("❌ [ANALYTICS] Failed to log interaction:", err.message);
        }
    }

    async logFailure(data) {
        const {
            sessionId,
            originalQuery,
            cleanedIntent,
            detectedDomain,
            failureReason
        } = data;

        try {
            await db.query(`
                INSERT INTO failed_queries (
                    session_id, original_query, cleaned_intent, 
                    detected_domain, failure_reason
                ) VALUES ($1, $2, $3, $4, $5)
            `, [sessionId, originalQuery, cleanedIntent, detectedDomain, failureReason]);
        } catch (err) {
            console.error("❌ [ANALYTICS] Failed to log query failure:", err.message);
        }
    }

    async logConversion(data) {
        const {
            sessionId,
            eventType,
            productId,
            category,
            orderId,
            revenue
        } = data;

        try {
            await db.query(`
                INSERT INTO commerce_conversion_logs (
                    session_id, event_type, product_id, category, order_id, revenue
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [sessionId, eventType, productId, category, orderId, revenue]);
        } catch (err) {
            console.error("❌ [ANALYTICS] Failed to log conversion:", err.message);
        }
    }

    async getOverview(startDate, endDate) {
        const query = `
            SELECT 
                COUNT(DISTINCT session_id) as total_conversations,
                AVG(response_latency) as avg_latency,
                COUNT(*) FILTER (WHERE fallback_usage = true)::FLOAT / NULLIF(COUNT(*), 0) as fallback_rate,
                (SELECT COUNT(*) FROM commerce_conversion_logs WHERE timestamp BETWEEN $1 AND $2) as total_conversions
            FROM chat_analytics_logs
            WHERE timestamp BETWEEN $1 AND $2
        `;
        const result = await db.query(query, [startDate, endDate]);
        return result.rows[0];
    }

    async getFailures(startDate, endDate, limit = 50, offset = 0) {
        const query = `
            SELECT * FROM failed_queries
            WHERE timestamp BETWEEN $1 AND $2
            ORDER BY timestamp DESC
            LIMIT $3 OFFSET $4
        `;
        const result = await db.query(query, [startDate, endDate, limit, offset]);
        return result.rows;
    }

    async getTrending(startDate, endDate) {
        const productsQuery = `
            SELECT p.name, COUNT(*) as occurrences
            FROM chat_analytics_logs, jsonb_array_elements_text(matched_products) as pid
            JOIN products p ON p.id = pid::uuid
            WHERE timestamp BETWEEN $1 AND $2
            GROUP BY p.name
            ORDER BY occurrences DESC
            LIMIT 10
        `;
        const categoriesQuery = `
            SELECT detected_category, COUNT(*) as occurrences
            FROM chat_analytics_logs
            WHERE timestamp BETWEEN $1 AND $2 AND detected_category IS NOT NULL
            GROUP BY detected_category
            ORDER BY occurrences DESC
            LIMIT 10
        `;
        const products = await db.query(productsQuery, [startDate, endDate]);
        const categories = await db.query(categoriesQuery, [startDate, endDate]);
        return { products: products.rows, categories: categories.rows };
    }

    async getConversions(startDate, endDate) {
        const query = `
            SELECT event_type, COUNT(*) as count
            FROM commerce_conversion_logs
            WHERE timestamp BETWEEN $1 AND $2
            GROUP BY event_type
            ORDER BY count DESC
        `;
        const result = await db.query(query, [startDate, endDate]);
        return result.rows;
    }

    async getRevenue(startDate, endDate) {
        const query = `
            SELECT 
                COALESCE(SUM(revenue), 0) as total_revenue,
                category,
                COUNT(*) as conversion_count
            FROM commerce_conversion_logs
            WHERE timestamp BETWEEN $1 AND $2 AND event_type = 'purchase'
            GROUP BY category
            ORDER BY total_revenue DESC
        `;
        const result = await db.query(query, [startDate, endDate]);
        return result.rows;
    }

    async logRestrictedQuery(data) {
        const { sessionId, query, blockedReason } = data;
        try {
            await db.query(`
                INSERT INTO restricted_query_logs (session_id, query, blocked_reason)
                VALUES ($1, $2, $3)
            `, [sessionId, query, blockedReason]);
        } catch (err) {
            console.error("❌ [ANALYTICS] Failed to log restricted query:", err.message);
        }
    }
}

module.exports = new ChatAnalyticsService();
