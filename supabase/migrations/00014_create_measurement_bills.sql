-- Create measurement_bills table
CREATE TABLE public.measurement_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_number TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  measurer_id UUID REFERENCES auth.users(id),
  measurement_date DATE,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  file_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.measurement_bills ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all for authenticated users (measurement_bills)"
ON public.measurement_bills
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
