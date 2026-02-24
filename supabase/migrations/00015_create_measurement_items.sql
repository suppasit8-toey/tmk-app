-- Create measurement_items table
CREATE TABLE public.measurement_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID REFERENCES public.measurement_bills(id) ON DELETE CASCADE NOT NULL,
  location_name TEXT NOT NULL,
  details TEXT,
  image_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.measurement_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all for authenticated users (measurement_items)"
ON public.measurement_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
