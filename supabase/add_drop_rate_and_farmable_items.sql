-- Add drop_rate_per_hour and farmable_items columns to farms table
-- Run this in Supabase SQL Editor if you already have the farms table

ALTER TABLE farms 
ADD COLUMN IF NOT EXISTS drop_rate_per_hour JSONB DEFAULT '[]'::jsonb;

ALTER TABLE farms 
ADD COLUMN IF NOT EXISTS farmable_items TEXT[] DEFAULT ARRAY[]::TEXT[];

