-- ==============================================================================
-- CarShop ERP: Supabase / PostgreSQL Schema Migration
-- Features: Web Push Subscriptions & In-App Notification History
--
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/yqigmkwdkwjmsvtcztai/sql/new
-- 2. Paste the SQL below into the SQL Editor and click "Run".
-- ==============================================================================

-- 1. Create push_subscriptions table (supports multiple devices per user)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    auth_token TEXT NOT NULL,
    content_encoding VARCHAR(50) DEFAULT 'aes128gcm',
    device_name VARCHAR(255),
    user_agent TEXT,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON public.push_subscriptions(user_id);

-- 2. Create notifications table (in-app history for notification bell)
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(100) DEFAULT 'general' NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    url VARCHAR(255),
    related_type VARCHAR(100),
    related_id BIGINT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read_at);

-- 3. Add inclusions column to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS inclusions JSONB DEFAULT '[]'::jsonb;
