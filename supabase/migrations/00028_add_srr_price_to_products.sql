-- Add srr_price to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS srr_price NUMERIC NOT NULL DEFAULT 0;
