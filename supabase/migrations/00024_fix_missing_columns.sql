-- Add ALL missing columns to product_categories, just in case they were not created earlier
ALTER TABLE public.product_categories
    ADD COLUMN IF NOT EXISTS sales_calc_method TEXT DEFAULT 'area_sqm' NOT NULL,
    ADD COLUMN IF NOT EXISTS cost_calc_method TEXT DEFAULT 'area_sqm' NOT NULL,
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

-- IMPORTANT: Reload PostgREST schema cache so new columns are visible via the API immediately
NOTIFY pgrst, 'reload schema';
