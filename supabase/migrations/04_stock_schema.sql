-- Supabase PostgreSQL Migration for Stock Products & Stock Returns
-- Enforces SKU-based pricing and returned order delivery charges

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. stock_products table (Product prices configuration per SKU)
CREATE TABLE IF NOT EXISTS public.stock_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_id TEXT UNIQUE NOT NULL,
    product_name TEXT,
    purchase_price NUMERIC(12,2),
    selling_price NUMERIC(12,2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. stock_returns table (Delivery boy charges and return metadata per order)
CREATE TABLE IF NOT EXISTS public.stock_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT UNIQUE NOT NULL,
    order_item_id TEXT,
    sku_id TEXT,
    quantity INTEGER DEFAULT 1,
    delivery_boy_charge NUMERIC(12,2) DEFAULT 0,
    return_reason TEXT,
    returned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_stock_products_sku_id ON public.stock_products(sku_id);
CREATE INDEX IF NOT EXISTS idx_stock_returns_order_id ON public.stock_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_returns_sku_id ON public.stock_returns(sku_id);

-- Disable Row Level Security (RLS) to allow full API access
ALTER TABLE public.stock_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_returns DISABLE ROW LEVEL SECURITY;

-- Auto-update timestamp triggers
DROP TRIGGER IF EXISTS set_stock_products_updated_at ON public.stock_products;
CREATE TRIGGER set_stock_products_updated_at
BEFORE UPDATE ON public.stock_products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_stock_returns_updated_at ON public.stock_returns;
CREATE TRIGGER set_stock_returns_updated_at
BEFORE UPDATE ON public.stock_returns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
