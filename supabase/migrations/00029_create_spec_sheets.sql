-- Create Spec Sheets table
CREATE TABLE IF NOT EXISTS public.spec_sheets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES public.measurement_bills(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Spec Sheet Items table
CREATE TABLE IF NOT EXISTS public.spec_sheet_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    spec_sheet_id UUID REFERENCES public.spec_sheets(id) ON DELETE CASCADE NOT NULL,
    measurement_item_id UUID REFERENCES public.measurement_items(id) ON DELETE SET NULL,
    location_name TEXT NOT NULL,
    order_width NUMERIC(10, 2) DEFAULT 0,
    order_height NUMERIC(10, 2) DEFAULT 0,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT DEFAULT '',
    unit_price NUMERIC(15, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.spec_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_sheet_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spec_sheets
CREATE POLICY "Enable read for authenticated users (spec_sheets)" ON public.spec_sheets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users (spec_sheets)" ON public.spec_sheets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users (spec_sheets)" ON public.spec_sheets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users (spec_sheets)" ON public.spec_sheets FOR DELETE TO authenticated USING (true);

-- RLS Policies for spec_sheet_items
CREATE POLICY "Enable read for authenticated users (spec_sheet_items)" ON public.spec_sheet_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users (spec_sheet_items)" ON public.spec_sheet_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users (spec_sheet_items)" ON public.spec_sheet_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users (spec_sheet_items)" ON public.spec_sheet_items FOR DELETE TO authenticated USING (true);
