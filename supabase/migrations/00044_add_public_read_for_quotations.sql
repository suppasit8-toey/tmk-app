-- Add public read-only access for quotation viewing via shared links
-- This allows unauthenticated users (anon role) to SELECT quotations,
-- quotation_items, customers, and stores for the public quotation view.

-- Allow public SELECT on quotations
CREATE POLICY "Enable public read for quotations (anon)"
ON public.quotations
FOR SELECT
TO anon
USING (true);

-- Allow public SELECT on quotation_items
CREATE POLICY "Enable public read for quotation_items (anon)"
ON public.quotation_items
FOR SELECT
TO anon
USING (true);

-- Allow public SELECT on customers (for displaying customer name on quotation)
CREATE POLICY "Enable public read for customers (anon)"
ON public.customers
FOR SELECT
TO anon
USING (true);

-- Allow public SELECT on stores (for displaying store info on quotation)
CREATE POLICY "Enable public read for stores (anon)"
ON public.stores
FOR SELECT
TO anon
USING (true);
