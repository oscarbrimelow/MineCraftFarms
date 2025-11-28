-- Set admin role for OscarBrimelow
-- Run this in Supabase SQL Editor

UPDATE users 
SET role = 'admin' 
WHERE email = 'oscarbrimelow@gmail.com' OR username = 'OscarBrimelow';

-- Verify the update
SELECT id, username, email, role 
FROM users 
WHERE email = 'oscarbrimelow@gmail.com' OR username = 'OscarBrimelow';

