const NodeCache = require('node-cache');
const crypto = require('crypto');

// 1. Embedding Cache (Store results for common queries)
const embeddingCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 }); // 24 hours

// 2. Response Cache (Store AI replies for exact/normalized queries)
const responseCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1 hour

/**
 * Normalizes user queries to improve cache hit rate.
 * Removes punctuation, extra spaces, and converts to lowercase.
 */
function normalizeQuery(query) {
    return query
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}

/**
 * Generates a cache key for a query + session context.
 */
function getCacheKey(query, context = '') {
    const normalized = normalizeQuery(query);
    return crypto.createHash('md5').update(`${normalized}:${context}`).digest('hex');
}

module.exports = {
    embeddingCache,
    responseCache,
    normalizeQuery,
    getCacheKey
};
