-- Add document_no to spec_sheets and populate existing ones

-- 1. Add column (nullable at first)
ALTER TABLE public.spec_sheets 
ADD COLUMN document_no TEXT UNIQUE;

-- 2. Populate existing rows with a format SS-oldid to avoid nulls
UPDATE public.spec_sheets
SET document_no = 'SS-OLD-' || substr(id::text, 1, 8)
WHERE document_no IS NULL;

-- 3. Make the column NOT NULL
ALTER TABLE public.spec_sheets 
ALTER COLUMN document_no SET NOT NULL;
