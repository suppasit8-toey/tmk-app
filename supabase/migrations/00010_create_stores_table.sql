-- 1. Create the Stores table
CREATE TABLE public.stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tax_id TEXT,
  address TEXT,
  phone TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add store_id to Quotations
ALTER TABLE public.quotations 
ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Enable all for authenticated users (stores)"
ON public.stores
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
