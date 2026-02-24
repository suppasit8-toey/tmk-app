-- 1. Create a custom ENUM type for Installation Job Status
CREATE TYPE public.job_status AS ENUM (
  'pending',
  'measuring',
  'measured',
  'installing',
  'completed',
  'cancelled'
);

-- 2. Create the Installation Jobs table
CREATE TABLE public.installation_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_number TEXT NOT NULL UNIQUE,              -- e.g., "JOB-20260222-1234"
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  status public.job_status DEFAULT 'pending'::public.job_status,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_date DATE,
  scheduled_time TEXT,                          -- e.g., "09:00", "14:30"
  address TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.installation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users (installation_jobs)"
ON public.installation_jobs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
