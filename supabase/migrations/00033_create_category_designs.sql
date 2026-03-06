-- Category Designs (ดีไซส์ภายใต้หมวดหมู่)
CREATE TABLE IF NOT EXISTS category_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    width_source TEXT NOT NULL DEFAULT 'frame_width',
    width_offset NUMERIC(10,2) NOT NULL DEFAULT 0,
    height_source TEXT NOT NULL DEFAULT 'frame_height',
    height_offset NUMERIC(10,2) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE category_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read designs" ON category_designs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert designs" ON category_designs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update designs" ON category_designs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete designs" ON category_designs FOR DELETE TO authenticated USING (true);
