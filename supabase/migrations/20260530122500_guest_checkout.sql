-- Migration for WhatsApp OTP Guest Checkout

-- 1. Extend Existing Users/Customers Table
-- (Assuming the table is named 'users', change if it's 'customers')
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS guest_converted_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMP WITH TIME ZONE NULL;

-- 2. Create otp_verifications Table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups by phone and validity
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone_expires 
ON public.otp_verifications(phone, expires_at);

-- 3. Create guest_sessions Table
CREATE TABLE IF NOT EXISTS public.guest_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    browser TEXT,
    device TEXT,
    ip_address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Index for session lookups
CREATE INDEX IF NOT EXISTS idx_guest_sessions_token 
ON public.guest_sessions(session_token);

-- 4. Extend Orders Table (Assuming 'public.orders')
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS guest_order BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Drop constraints if necessary (e.g., if user_id was NOT NULL)
-- ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
