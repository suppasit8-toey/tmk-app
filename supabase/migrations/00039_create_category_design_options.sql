-- Design Options (ตัวเลือกดีไซน์สำหรับหมวดหมู่)
-- เช่น ม่านม้วน → กลุ่ม "โซ่" → ตัวเลือก ["โซ่ขวา", "โซ่ซ้าย"]
CREATE TABLE IF NOT EXISTS category_design_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    option_name TEXT NOT NULL,
    choices JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE category_design_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read design options" ON category_design_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert design options" ON category_design_options FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update design options" ON category_design_options FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete design options" ON category_design_options FOR DELETE TO authenticated USING (true);
