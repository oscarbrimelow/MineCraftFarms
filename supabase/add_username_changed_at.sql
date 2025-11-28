-- Add username_changed_at column and make username unique
-- Run this in Supabase SQL Editor if you already have the users table

-- Add username_changed_at column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ DEFAULT NOW();

-- Set username_changed_at for existing users to their created_at
UPDATE users 
SET username_changed_at = created_at 
WHERE username_changed_at IS NULL;

-- Make username unique (if not already)
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username);

