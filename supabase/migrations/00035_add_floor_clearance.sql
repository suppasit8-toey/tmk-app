-- Add floor clearance option to designs
ALTER TABLE category_designs ADD COLUMN IF NOT EXISTS floor_clearance NUMERIC(10,2) DEFAULT 0;
