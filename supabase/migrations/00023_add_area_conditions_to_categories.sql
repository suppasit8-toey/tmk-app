-- Add area calculation condition columns to product_categories
ALTER TABLE public.product_categories
    ADD COLUMN IF NOT EXISTS min_width_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS min_width NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_width_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS max_width NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_height_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS max_height NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS min_price_width_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS min_price_width NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS min_price_height_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS min_price_height NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS height_step_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS height_step NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS min_area_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS min_area NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS area_factor_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS area_factor NUMERIC(10, 4) DEFAULT 1,
    ADD COLUMN IF NOT EXISTS area_rounding_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS area_rounding NUMERIC(10, 2) DEFAULT 0;

-- Reload PostgREST schema cache so new columns are visible via the API
NOTIFY pgrst, 'reload schema';
