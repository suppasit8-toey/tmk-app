-- Create location_windows table
CREATE TABLE public.location_windows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES public.project_locations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'หน้าต่าง',
  details TEXT,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.location_windows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all for authenticated users (location_windows)"
ON public.location_windows
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
