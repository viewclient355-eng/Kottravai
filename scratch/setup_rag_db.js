const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

const sql = `
-- Drop old function
DROP FUNCTION IF EXISTS match_knowledge(vector, float, int);

-- Drop old table
DROP TABLE IF EXISTS knowledge CASCADE;

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge table for Gemini (3072 dims - observed from previous run)
CREATE TABLE knowledge (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content text NOT NULL UNIQUE,
    metadata jsonb DEFAULT '{}'::jsonb,
    embedding vector(3072),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create the matching function
CREATE OR REPLACE FUNCTION match_knowledge(
    query_embedding vector(3072),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        knowledge.id,
        knowledge.content,
        knowledge.metadata,
        1 - (knowledge.embedding <=> query_embedding) AS similarity
    FROM knowledge
    WHERE 1 - (knowledge.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;
`;

async function setup() {
    try {
        await client.connect();
        console.log("Connected to database.");
        await client.query(sql);
        console.log("Successfully reset and created knowledge table (3072 dims) and matching function.");
    } catch (err) {
        console.error("Setup failed:", err.message);
    } finally {
        await client.end();
    }
}

setup();
