-- Supabase PostgreSQL Migration for Order Records Table
-- Enforces globally unique order_id and return status tracking

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create order_records table
CREATE TABLE IF NOT EXISTS public.order_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    sku_id TEXT,
    product_name TEXT,
    purchase_price NUMERIC(12,2),
    selling_price NUMERIC(12,2),
    quantity INTEGER DEFAULT 1,
    is_returned BOOLEAN DEFAULT false,
    document_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_order_records_order_id ON public.order_records(order_id);
CREATE INDEX IF NOT EXISTS idx_order_records_is_returned ON public.order_records(is_returned);
CREATE INDEX IF NOT EXISTS idx_order_records_created_at ON public.order_records(created_at DESC);

-- 3. Disable Row Level Security (RLS) to allow full API access
ALTER TABLE public.order_records DISABLE ROW LEVEL SECURITY;

-- 4. Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Trigger for auto update timestamp
DROP TRIGGER IF EXISTS set_order_records_updated_at ON public.order_records;
CREATE TRIGGER set_order_records_updated_at
BEFORE UPDATE ON public.order_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
