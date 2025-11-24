-- PostgreSQL script for Supabase
-- Fix match_history table schema to add missing user_name column
ALTER TABLE match_history 
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Update existing records to set user_name if missing
-- This extracts from session_id or sets to 'Unknown User'
UPDATE match_history 
SET user_name = 'Unknown User' 
WHERE user_name IS NULL;

-- Make user_name NOT NULL after setting defaults
ALTER TABLE match_history 
ALTER COLUMN user_name SET NOT NULL;
