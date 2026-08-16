-- Master Supabase PostgreSQL Setup Script for Parcel Label Parser
-- Run this complete script in Supabase SQL Editor to create all tables and disable RLS.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADING',
    processing_time INTEGER DEFAULT 0,
    overall_confidence NUMERIC(4,3) DEFAULT 0.0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Extraction Results Table (Raw & Structured Output)
CREATE TABLE IF NOT EXISTS public.extraction_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    raw_response JSONB NOT NULL,
    structured_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Extracted Items Table
CREATE TABLE IF NOT EXISTS public.extracted_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    sku_id VARCHAR(100),
    product_name VARCHAR(255),
    description TEXT,
    quantity INTEGER,
    unit VARCHAR(50),
    price NUMERIC(12,2),
    confidence NUMERIC(4,3) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Extracted Fields Table
CREATE TABLE IF NOT EXISTS public.extracted_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    field_category VARCHAR(100),
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT,
    confidence NUMERIC(4,3) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Corrections Table
CREATE TABLE IF NOT EXISTS public.corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    original_value TEXT,
    corrected_value TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Order Records Table (Flat Unique Order Management)
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

-- DISABLE ROW LEVEL SECURITY (RLS) across all tables to allow full API access
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_records DISABLE ROW LEVEL SECURITY;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extraction_results_doc ON public.extraction_results(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_items_doc ON public.extracted_items(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_fields_doc ON public.extracted_fields(document_id);
CREATE INDEX IF NOT EXISTS idx_corrections_doc ON public.corrections(document_id);
CREATE INDEX IF NOT EXISTS idx_order_records_order_id ON public.order_records(order_id);

-- Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public) 
VALUES ('parcel-labels', 'parcel-labels', true)
ON CONFLICT (id) DO NOTHING;
