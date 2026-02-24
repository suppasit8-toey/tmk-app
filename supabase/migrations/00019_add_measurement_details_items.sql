-- Add JSONB column for detailed measurements
ALTER TABLE public.measurement_items ADD COLUMN measurement_details JSONB;
