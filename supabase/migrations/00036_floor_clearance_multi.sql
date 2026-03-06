-- Change floor_clearance from single value to multi-select JSONB array
ALTER TABLE category_designs DROP COLUMN IF EXISTS floor_clearance;
ALTER TABLE category_designs ADD COLUMN IF NOT EXISTS floor_clearance_options JSONB DEFAULT '[]'::jsonb;
