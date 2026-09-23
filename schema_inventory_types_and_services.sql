-- ==============================================================================
-- CarShop ERP: Supabase / PostgreSQL Schema Migration
-- Features: Inventory Types, Services Build File, Keywords, and Markup Rates
--
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/yqigmkwdkwjmsvtcztai/sql/new
-- 2. Paste the SQL below into the SQL Editor and click "Run".
-- ==============================================================================

-- 1. Create inventory_types table
CREATE TABLE IF NOT EXISTS public.inventory_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- 2. Create services table
CREATE TABLE IF NOT EXISTS public.services (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(100) UNIQUE,
    type VARCHAR(100),
    keyword VARCHAR(255),
    description TEXT,
    price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- 3. Add type, keyword, and markup_rate columns to inventories table if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'inventories' AND column_name = 'type'
    ) THEN
        ALTER TABLE public.inventories ADD COLUMN type VARCHAR(100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'inventories' AND column_name = 'keyword'
    ) THEN
        ALTER TABLE public.inventories ADD COLUMN keyword VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'inventories' AND column_name = 'markup_rate'
    ) THEN
        ALTER TABLE public.inventories ADD COLUMN markup_rate NUMERIC(8, 2) DEFAULT 0.00;
    END IF;
END $$;

-- 4. Add keyword column to services table if not already added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'keyword'
    ) THEN
        ALTER TABLE public.services ADD COLUMN keyword VARCHAR(255);
    END IF;
END $$;

-- 5. Seed default inventory types if empty
INSERT INTO public.inventory_types (name, description) VALUES
('Part', 'Mechanical and replacement parts'),
('Labor', 'Service and labor types'),
('Oil & Fluids', 'Engine oils, brake fluids, lubricants'),
('Tire & Wheels', 'Tires, wheels, and wheel balancing'),
('Electrical', 'Batteries, alternators, sensors, lighting'),
('Body & Paint', 'Body panels, paint, detailing supplies'),
('Other', 'Miscellaneous items')
ON CONFLICT (name) DO NOTHING;
