-- Split single offset into left/right (width) and top/bottom (height)
ALTER TABLE category_designs ADD COLUMN IF NOT EXISTS width_offset_left NUMERIC(10,2) DEFAULT 0;
ALTER TABLE category_designs ADD COLUMN IF NOT EXISTS width_offset_right NUMERIC(10,2) DEFAULT 0;
ALTER TABLE category_designs ADD COLUMN IF NOT EXISTS height_offset_top NUMERIC(10,2) DEFAULT 0;
ALTER TABLE category_designs ADD COLUMN IF NOT EXISTS height_offset_bottom NUMERIC(10,2) DEFAULT 0;

-- Migrate existing data: put old offset into right/bottom
UPDATE category_designs SET
    width_offset_left = 0,
    width_offset_right = COALESCE(width_offset, 0),
    height_offset_top = 0,
    height_offset_bottom = COALESCE(height_offset, 0)
WHERE width_offset IS NOT NULL OR height_offset IS NOT NULL;

-- Drop old columns
ALTER TABLE category_designs DROP COLUMN IF EXISTS width_offset;
ALTER TABLE category_designs DROP COLUMN IF EXISTS height_offset;
