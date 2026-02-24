-- 1. Create a custom ENUM type for User Roles
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'customer_service',
  'sales_measurement',
  'technician',
  'supervisor',
  'stock_checker',
  'purchasing',
  'accounting',
  'quotation',
  'marketing'
);

-- 2. Create the Profiles table 
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role public.app_role DEFAULT 'sales_measurement'::public.app_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create Security Policies
-- Policy: View profile (Users can see all profiles, or limit to their own based on requirements. Allowing all for easier internal team viewing)
CREATE POLICY "Profiles are viewable by users who created them."
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

-- Users can update their own profile
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Admins can do everything (we will handle admin checks later, for now sticking to basic user self-management)
-- Optionally, add policies for specific roles.

-- 5. Create a Trigger to automatically create a Profile when a User signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
