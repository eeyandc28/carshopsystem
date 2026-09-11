-- Complete Supabase Schema for Deliveries & Payments
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/yqigmkwdkwjmsvtcztai/sql/new)

-- 1. Create deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
    id BIGSERIAL PRIMARY KEY,
    delivery_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id BIGINT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    received_by TEXT,
    received_date DATE NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'received',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create delivery_items table
CREATE TABLE IF NOT EXISTS public.delivery_items (
    id BIGSERIAL PRIMARY KEY,
    delivery_id BIGINT REFERENCES public.deliveries(id) ON DELETE CASCADE,
    inventory_id BIGINT REFERENCES public.inventories(id) ON DELETE CASCADE,
    quantity_received INTEGER NOT NULL DEFAULT 1,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create payments table if not exists, or alter if exists
CREATE TABLE IF NOT EXISTS public.payments (
    id BIGSERIAL PRIMARY KEY,
    job_order_id BIGINT REFERENCES public.job_orders(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'Cash',
    reference_number VARCHAR(100),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Ensure payments columns exist if table was already present
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS job_order_id BIGINT REFERENCES public.job_orders(id) ON DELETE CASCADE;

-- 4. Ensure job_orders table has discount and payment columns
ALTER TABLE public.job_orders ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.job_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';
ALTER TABLE public.job_orders ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) DEFAULT 0.00;

-- 5. Enable Row Level Security Policies
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to deliveries" ON public.deliveries;
CREATE POLICY "Allow all access to deliveries" ON public.deliveries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to delivery_items" ON public.delivery_items;
CREATE POLICY "Allow all access to delivery_items" ON public.delivery_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to payments" ON public.payments;
CREATE POLICY "Allow all access to payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
