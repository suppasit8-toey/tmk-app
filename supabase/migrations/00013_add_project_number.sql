-- Add project_number column to projects table
ALTER TABLE public.projects ADD COLUMN project_number TEXT UNIQUE;

-- We could populate existing ones here if needed, but since it's a new feature, 
-- we will let existing ones have a null project_number for now, 
-- or you can manually update them.
