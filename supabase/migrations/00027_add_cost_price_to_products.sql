-- Add cost_price to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0;
