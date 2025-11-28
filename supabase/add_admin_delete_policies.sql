-- Add RLS policies to allow admins to delete farms, comments, and users
-- Run this in Supabase SQL Editor

-- Allow admins to delete any farm
CREATE POLICY "Admins can delete any farm" ON farms
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Allow admins to delete any comment
CREATE POLICY "Admins can delete any comment" ON comments
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Allow admins to delete any user
CREATE POLICY "Admins can delete any user" ON users
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Allow admins to update any user (for role changes)
CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

