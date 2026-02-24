-- 1. Create a custom ENUM type for Project Status
CREATE TYPE public.project_status AS ENUM (
  'planning',
  'in_progress',
  'completed',
  'on_hold',
  'cancelled'
);

-- 2. Create the Projects table
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  status public.project_status DEFAULT 'planning'::public.project_status,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add project_id to Quotations
ALTER TABLE public.quotations 
ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- 4. Add project_id to Installation Jobs
ALTER TABLE public.installation_jobs 
ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- 5. Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 6. Policies
CREATE POLICY "Enable all for authenticated users (projects)"
ON public.projects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
