-- Add category_id to measurement_items to link spaces with product types
ALTER TABLE public.measurement_items
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL;

-- Reload schema cache to make sure PostgREST is aware of category_id immediately
NOTIFY pgrst, 'reload schema';
