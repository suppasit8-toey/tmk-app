-- 1. Create the Referrers table
CREATE TABLE public.referrers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  line_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add referrer_id to customers table
ALTER TABLE public.customers 
ADD COLUMN referrer_id UUID REFERENCES public.referrers(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.referrers ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Enable all for authenticated users (referrers)"
ON public.referrers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
