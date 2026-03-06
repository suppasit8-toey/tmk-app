-- Create fabric_price_codes table (was missing from database)
CREATE TABLE IF NOT EXISTS public.fabric_price_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
    code_name TEXT NOT NULL,
    code_color TEXT DEFAULT '#ef4444',
    fabric_width NUMERIC(10,2) DEFAULT 2.8,
    normal_sell_price NUMERIC(15,2) DEFAULT 0,
    normal_cost_price NUMERIC(15,2) DEFAULT 0,
    rotated_cost_per_yard NUMERIC(15,2) DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add fabric calculation constants to product_categories (if missing)
ALTER TABLE public.product_categories
    ADD COLUMN IF NOT EXISTS fabric_multiplier NUMERIC(10,2) DEFAULT 2.5,
    ADD COLUMN IF NOT EXISTS rail_cost_per_meter NUMERIC(10,2) DEFAULT 100,
    ADD COLUMN IF NOT EXISTS sewing_cost_per_meter NUMERIC(10,2) DEFAULT 180,
    ADD COLUMN IF NOT EXISTS selling_markup NUMERIC(10,2) DEFAULT 2,
    ADD COLUMN IF NOT EXISTS height_allowance NUMERIC(10,2) DEFAULT 0.5,
    ADD COLUMN IF NOT EXISTS normal_height_deduction NUMERIC(10,2) DEFAULT 0.4,
    ADD COLUMN IF NOT EXISTS fabric_width_deduction NUMERIC(10,2) DEFAULT 0.2;

-- Enable RLS
ALTER TABLE public.fabric_price_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can read fabric_price_codes"
    ON public.fabric_price_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert fabric_price_codes"
    ON public.fabric_price_codes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update fabric_price_codes"
    ON public.fabric_price_codes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete fabric_price_codes"
    ON public.fabric_price_codes FOR DELETE TO authenticated USING (true);
