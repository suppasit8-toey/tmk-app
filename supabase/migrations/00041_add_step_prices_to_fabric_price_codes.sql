-- Add step_prices JSONB column to fabric_price_codes
ALTER TABLE public.fabric_price_codes
ADD COLUMN IF NOT EXISTS step_prices JSONB DEFAULT '[]'::jsonb;
