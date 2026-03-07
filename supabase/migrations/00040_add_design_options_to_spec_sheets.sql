-- Migration: Add design_options to spec_sheet_items
-- Adds a JSONB column to store user-selected design options mapped from measurement details.

ALTER TABLE spec_sheet_items
ADD COLUMN IF NOT EXISTS design_options JSONB DEFAULT '{}'::jsonb;
