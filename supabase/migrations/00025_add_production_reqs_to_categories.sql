-- Add production_reqs column to product_categories to store required measurement fields
ALTER TABLE public.product_categories
    ADD COLUMN IF NOT EXISTS production_reqs JSONB DEFAULT '{}'::jsonb;

-- Reload PostgREST schema cache so the new column is visible via the API immediately
NOTIFY pgrst, 'reload schema';
