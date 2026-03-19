-- Add fabric_code_id column to spec_sheet_items for Roman Blinds / step pricing
ALTER TABLE public.spec_sheet_items
ADD COLUMN IF NOT EXISTS fabric_code_id UUID REFERENCES public.fabric_price_codes(id) ON DELETE SET NULL;
