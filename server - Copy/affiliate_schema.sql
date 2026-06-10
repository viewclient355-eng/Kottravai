-- Affiliate System Schema

-- 1. Update Existing Tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_affiliate_eligible BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_commission_rate DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_payout_type VARCHAR(20) DEFAULT 'percentage';
ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_fixed_amount DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_code VARCHAR(255);

-- 2. New Affiliate Tables

-- Affiliate Applications
CREATE TABLE IF NOT EXISTS affiliate_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    city VARCHAR(100),
    instagram_link TEXT,
    facebook_link TEXT,
    twitter_link TEXT,
    youtube_link TEXT,
    selling_experience TEXT,
    products_promoted TEXT,
    reason TEXT,
    user_id UUID,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Active Affiliates
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    city VARCHAR(100),
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    level VARCHAR(50) DEFAULT 'Ambassador',
    total_sales DECIMAL(15, 2) DEFAULT 0,
    total_commission DECIMAL(15, 2) DEFAULT 0,
    available_balance DECIMAL(15, 2) DEFAULT 0,
    upi_id VARCHAR(255),
    bank_name VARCHAR(255),
    account_number VARCHAR(255),
    ifsc_code VARCHAR(50),
    instagram_link TEXT,
    facebook_link TEXT,
    twitter_link TEXT,
    youtube_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate Referral Links
CREATE TABLE IF NOT EXISTS affiliate_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
    product_id UUID,
    slug VARCHAR(100) UNIQUE NOT NULL,
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate Clicks (Tracking)
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID REFERENCES affiliate_links(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate Sales (Commissions)
CREATE TABLE IF NOT EXISTS affiliate_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
    product_id UUID,
    product_name VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    sale_amount DECIMAL(15, 2) NOT NULL,
    commission_rate DECIMAL(10, 2),
    commission_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate Payouts
CREATE TABLE IF NOT EXISTS affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate_id ON affiliate_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_affiliate_id ON affiliate_sales(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_order_id ON affiliate_sales(order_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_link_id ON affiliate_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);
