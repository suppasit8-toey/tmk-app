-- Run this SQL in your Supabase SQL Editor to make your first user an Admin.
-- Replace 'YOUR_EMAIL@EXAMPLE.COM' with the email you used to register.

UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@EXAMPLE.COM'
);
