-- 1. Create the Corporate Customers table
CREATE TABLE public.corporate_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  tax_id TEXT,
  contact_person TEXT,
  phone TEXT,
  line_id TEXT,
  address TEXT,
  location_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  referrer_id UUID REFERENCES public.referrers(id) ON DELETE SET NULL
);

-- 2. Add corporate_customer_id to Quotations and Projects
ALTER TABLE public.quotations 
ALTER COLUMN customer_id DROP NOT NULL,
ADD COLUMN corporate_customer_id UUID REFERENCES public.corporate_customers(id) ON DELETE CASCADE;

ALTER TABLE public.projects 
ALTER COLUMN customer_id DROP NOT NULL,
ADD COLUMN corporate_customer_id UUID REFERENCES public.corporate_customers(id) ON DELETE CASCADE;

-- 3. Cleanup `customers` table from previous migration 00011 (if it was applied)
-- We use a DO block to prevent errors if the columns don't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_type') THEN
        ALTER TABLE public.customers DROP COLUMN customer_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'company_name') THEN
        ALTER TABLE public.customers DROP COLUMN company_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tax_id') THEN
        ALTER TABLE public.customers DROP COLUMN tax_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'contact_person') THEN
        ALTER TABLE public.customers DROP COLUMN contact_person;
    END IF;
END $$;

-- Enforce first_name and last_name on `customers` again if possible
-- Warning: this might fail if there are rows with NULLs. Assuming clean local DB or no nulls yet.
-- ALTER TABLE public.customers ALTER COLUMN first_name SET NOT NULL;
-- ALTER TABLE public.customers ALTER COLUMN last_name SET NOT NULL;

-- 4. Enable RLS
ALTER TABLE public.corporate_customers ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Enable all for authenticated users (corporate_customers)"
ON public.corporate_customers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
