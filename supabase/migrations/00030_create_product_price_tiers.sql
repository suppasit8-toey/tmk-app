-- Create Product Price Tiers Table for Step Pricing
CREATE TABLE public.product_price_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    min_width NUMERIC(10,2) NOT NULL,
    max_width NUMERIC(10,2) NOT NULL,
    price NUMERIC(15,2) NOT NULL,
    platform_price NUMERIC(15,2) DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_price_tiers ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Enable read for authenticated users (product_price_tiers)"
ON public.product_price_tiers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users (product_price_tiers)"
ON public.product_price_tiers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users (product_price_tiers)"
ON public.product_price_tiers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users (product_price_tiers)"
ON public.product_price_tiers FOR DELETE TO authenticated USING (true);
