-- Fix RLS policy for users table to allow signup
-- Run this in Supabase SQL Editor if you're getting RLS errors on signup

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create INSERT policy for users table
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

