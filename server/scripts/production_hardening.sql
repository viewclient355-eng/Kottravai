-- Thozhi AI Production Hardening Migration

-- 1. Create chat_audit_logs if not exists
CREATE TABLE IF NOT EXISTS chat_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_query TEXT NOT NULL,
    retrieved_context TEXT,
    similarity_scores JSONB,
    ai_response TEXT,
    fallback_used BOOLEAN DEFAULT false,
    latency_ms INTEGER,
    latency_breakdown JSONB,
    confidence_level VARCHAR(20),
    session_id VARCHAR(255),
    preferences_extracted JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add indexes for observability
CREATE INDEX IF NOT EXISTS idx_chat_logs_session ON chat_audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_confidence ON chat_audit_logs(confidence_level);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created ON chat_audit_logs(created_at);

-- 3. Knowledge table indexing skipped (3072 dimensions exceed current pgvector index limit)
-- Sequential scan is sufficient for the current product catalog size.

-- 4. Add product_id to knowledge metadata for better tracking
-- This is handled by the upsert logic in vectorSync.js but good to have a comment here.
