-- 1. Create a custom ENUM type for Quotation Status
CREATE TYPE public.quotation_status AS ENUM (
  'draft',
  'sent',
  'approved',
  'rejected',
  'cancelled'
);

-- 2. Create the Customers table
CREATE TABLE public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  line_id TEXT,
  address TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the Quotations table
CREATE TABLE public.quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_number TEXT NOT NULL UNIQUE, -- e.g., "QT-202401-0001"
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  salesperson_id UUID REFERENCES auth.users(id),
  status public.quotation_status DEFAULT 'draft'::public.quotation_status,
  total_amount NUMERIC(15, 2) DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) DEFAULT 0.00,
  grand_total NUMERIC(15, 2) DEFAULT 0.00,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create the Quotation Items table
CREATE TABLE public.quotation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL, -- e.g., "ม่านจีบทึบแสง", "ม่านม้วน"
  description TEXT,
  width NUMERIC(10, 2), -- in cm
  height NUMERIC(10, 2), -- in cm
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(15, 2) NOT NULL,
  total_price NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Set up Row Level Security (RLS) policies 
-- For simplicity in this stage, we allow authenticated users to view all, 
-- but only certain roles can create/edit (logic can be enforced in UI/Server Auth).
-- To make the app functional quickly, we allow all authenticated users full access to these tables.
-- A stricter setup would check the `role` in the `profiles` table.

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users (customers)"
ON public.customers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users (quotations)"
ON public.quotations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users (quotation_items)"
ON public.quotation_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
