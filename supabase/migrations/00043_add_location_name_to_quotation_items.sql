-- Add location_name column to quotation_items to track the measurement location
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS location_name TEXT;
