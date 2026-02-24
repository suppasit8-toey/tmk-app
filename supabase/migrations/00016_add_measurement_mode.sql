-- Add measurement_mode column to measurement_bills table
ALTER TABLE public.measurement_bills
ADD COLUMN measurement_mode TEXT NOT NULL DEFAULT 'curtain';

-- Add a check constraint to ensure only valid modes are inserted
ALTER TABLE public.measurement_bills
ADD CONSTRAINT check_measurement_mode
CHECK (measurement_mode IN ('curtain', 'wallpaper', 'film'));
