-- Add referrer_id to projects table
ALTER TABLE public.projects 
ADD COLUMN referrer_id UUID REFERENCES public.referrers(id) ON DELETE SET NULL;
