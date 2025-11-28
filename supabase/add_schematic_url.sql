-- Add schematic_url column to farms table
-- Run this in Supabase SQL Editor if you already have the farms table

ALTER TABLE farms 
ADD COLUMN IF NOT EXISTS schematic_url TEXT;

