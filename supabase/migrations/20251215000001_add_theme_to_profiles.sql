-- Add theme column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'emerald-gold';

-- Add birthday column if it doesn't exist (for compatibility)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday DATE;
