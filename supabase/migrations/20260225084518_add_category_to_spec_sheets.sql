-- Add category_name to spec_sheet_items
ALTER TABLE public.spec_sheet_items
ADD COLUMN category_name TEXT;
