-- Suppliers (ซัพพลายเออร์)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert suppliers" ON suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update suppliers" ON suppliers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete suppliers" ON suppliers FOR DELETE TO authenticated USING (true);

-- Supplier Products (สินค้าของซัพพลายเออร์)
CREATE TABLE IF NOT EXISTS supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT '',
    product_code TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    description TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    unit TEXT NOT NULL DEFAULT 'ชิ้น',
    price_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read supplier_products" ON supplier_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert supplier_products" ON supplier_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update supplier_products" ON supplier_products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete supplier_products" ON supplier_products FOR DELETE TO authenticated USING (true);
