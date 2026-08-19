-- Supabase PostgreSQL Migration Script for Parcel Label Information Extraction
-- Enables storage bucket and creates required tables with indexes & foreign keys.
-- Enable UUID extension if not enabled

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADING', -- 'UPLOADING', 'ANALYZING', 'COMPLETED', 'NEEDS_REVIEW', 'FAILED'
    processing_time INTEGER DEFAULT 0, -- in milliseconds
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

-- 3. Extracted Items Table (Product line items)
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

-- 4. Extracted Fields Table (Flattened Key-Value Pairs for Quick Filtering)
CREATE TABLE IF NOT EXISTS public.extracted_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    field_category VARCHAR(100), -- 'order', 'shipping', 'customer', 'seller', 'other', 'additional'
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT,
    confidence NUMERIC(4,3) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Corrections Table (Audit Log for Manual User Edits)
CREATE TABLE IF NOT EXISTS public.corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    original_value TEXT,
    corrected_value TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for fast lookup and dashboard metrics
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extraction_results_doc ON public.extraction_results(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_items_doc ON public.extracted_items(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_fields_doc ON public.extracted_fields(document_id);
CREATE INDEX IF NOT EXISTS idx_corrections_doc ON public.corrections(document_id);

-- Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto update timestamp
DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_extraction_results_updated_at ON public.extraction_results;
CREATE TRIGGER set_extraction_results_updated_at
BEFORE UPDATE ON public.extraction_results
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Supabase Storage Bucket Initialization
-- Note: Run in Supabase SQL Editor to create public storage bucket named 'parcel-labels'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('parcel-labels', 'parcel-labels', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Security Policy (Allow Public Read & Service Role Uploads)
CREATE POLICY "Public Label Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'parcel-labels');

CREATE POLICY "Service Role Upload Access" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'parcel-labels');
