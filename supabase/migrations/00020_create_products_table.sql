-- Create Product Categories Table
CREATE TABLE public.product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sales_calc_method TEXT DEFAULT 'area_sqm' NOT NULL,
    cost_calc_method TEXT DEFAULT 'area_sqm' NOT NULL,
    -- Area calculation conditions
    min_width_enabled BOOLEAN DEFAULT false,
    min_width NUMERIC(10, 2) DEFAULT 0,
    max_width_enabled BOOLEAN DEFAULT false,
    max_width NUMERIC(10, 2) DEFAULT 0,
    max_height_enabled BOOLEAN DEFAULT false,
    max_height NUMERIC(10, 2) DEFAULT 0,
    min_price_width_enabled BOOLEAN DEFAULT false,
    min_price_width NUMERIC(10, 2) DEFAULT 0,
    min_price_height_enabled BOOLEAN DEFAULT false,
    min_price_height NUMERIC(10, 2) DEFAULT 0,
    height_step_enabled BOOLEAN DEFAULT false,
    height_step NUMERIC(10, 2) DEFAULT 0,
    min_area_enabled BOOLEAN DEFAULT false,
    min_area NUMERIC(10, 2) DEFAULT 0,
    area_factor_enabled BOOLEAN DEFAULT false,
    area_factor NUMERIC(10, 4) DEFAULT 1,
    area_rounding_enabled BOOLEAN DEFAULT false,
    area_rounding NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users (product_categories)"
ON public.product_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users (product_categories)"
ON public.product_categories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users (product_categories)"
ON public.product_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users (product_categories)"
ON public.product_categories FOR DELETE TO authenticated USING (true);


-- Create Products Table
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL NOT NULL,
    description TEXT,
    base_price NUMERIC(15, 2) DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'ตร.ม.',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users (products)"
ON public.products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users (products)"
ON public.products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users (products)"
ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users (products)"
ON public.products FOR DELETE TO authenticated USING (true);


-- Insert default categories
INSERT INTO public.product_categories (name) VALUES 
('ม่านจีบ'), 
('ม่านลอน'), 
('ม่านตาไก่'), 
('ม่านม้วน'), 
('ม่านปรับแสง'), 
('มู่ลี่'), 
('วอลเปเปอร์'), 
('รางม่าน'), 
('อุปกรณ์เสริม'), 
('อื่นๆ')
ON CONFLICT (name) DO NOTHING;
