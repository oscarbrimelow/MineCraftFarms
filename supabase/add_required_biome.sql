-- Add required_biome column to farms table
-- Run this in Supabase SQL Editor if you already have the farms table

ALTER TABLE farms 
ADD COLUMN IF NOT EXISTS required_biome TEXT;

