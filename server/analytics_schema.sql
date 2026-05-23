-- Analytics Schema for Thozhi AI Phase 12

-- Conversation Analytics
CREATE TABLE IF NOT EXISTS chat_analytics_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255),
    user_query TEXT,
    normalized_intent VARCHAR(100),
    detected_category VARCHAR(100),
    matched_products JSONB, -- Array of product IDs
    response_latency INTEGER, -- ms
    fallback_usage BOOLEAN DEFAULT FALSE,
    pricing_intent VARCHAR(50),
    conversational_domain VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Failed Queries Intelligence
CREATE TABLE IF NOT EXISTS failed_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255),
    original_query TEXT,
    cleaned_intent TEXT,
    detected_domain VARCHAR(100),
    failure_reason VARCHAR(100), -- 'zero_matches', 'ambiguous', 'category_conflict', 'retrieval_failure'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Commerce Conversion Logs
CREATE TABLE IF NOT EXISTS commerce_conversion_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255),
    event_type VARCHAR(50), -- 'click', 'cart_add', 'checkout', 'purchase'
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    category VARCHAR(100),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    revenue DECIMAL(10, 2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Preference Memory (Lightweight)
CREATE TABLE IF NOT EXISTS user_preference_memory (
    session_id VARCHAR(255) PRIMARY KEY,
    preferred_categories JSONB DEFAULT '[]',
    pricing_tendency VARCHAR(50), -- 'budget', 'premium'
    last_explored_products JSONB DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Analytics
CREATE INDEX IF NOT EXISTS idx_chat_analytics_session ON chat_analytics_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_timestamp ON chat_analytics_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_failed_queries_domain ON failed_queries(detected_domain);
CREATE INDEX IF NOT EXISTS idx_conversion_event ON commerce_conversion_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_conversion_timestamp ON commerce_conversion_logs(timestamp);
