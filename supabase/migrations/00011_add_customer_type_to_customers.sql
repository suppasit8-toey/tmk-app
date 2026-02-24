-- Update customers table schema for different customer types
ALTER TABLE public.customers
-- Add new columns for company details
ADD COLUMN tax_id TEXT,
ADD COLUMN company_name TEXT,
ADD COLUMN contact_person TEXT,
ADD COLUMN location_url TEXT;

-- We make first_name and last_name nullable since companies might only have company_name and contact_person
ALTER TABLE public.customers ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.customers ALTER COLUMN last_name DROP NOT NULL;

-- Update the customer_type column if it doesn't exist yet (from previous migration)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_type') THEN
        ALTER TABLE public.customers ADD COLUMN customer_type TEXT DEFAULT 'individual' CHECK (customer_type IN ('individual', 'company'));
    END IF;
END $$;
