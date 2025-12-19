-- Create a table to store each user's unique referral code
-- This separates the concept of "my referral code" from "referrals I've made"

CREATE TABLE IF NOT EXISTS user_referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_user ON user_referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_code ON user_referral_codes(referral_code);

-- Enable RLS
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own referral code"
  ON user_referral_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral code"
  ON user_referral_codes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to get or create a user's referral code
CREATE OR REPLACE FUNCTION get_or_create_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  -- Check if user already has a code
  SELECT referral_code INTO v_code
  FROM user_referral_codes
  WHERE user_id = p_user_id;
  
  -- If found, return it
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;
  
  -- Generate a unique code
  LOOP
    v_code := upper(substring(md5(random()::text) from 1 for 8));
    
    SELECT EXISTS(SELECT 1 FROM user_referral_codes WHERE referral_code = v_code) INTO v_exists;
    
    IF NOT v_exists THEN
      -- Insert the new code
      INSERT INTO user_referral_codes (user_id, referral_code)
      VALUES (p_user_id, v_code);
      
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$;

-- Migrate existing referral codes to the new table
-- Get unique referral codes from existing referrals
INSERT INTO user_referral_codes (user_id, referral_code)
SELECT DISTINCT referrer_id, referral_code
FROM referrals
WHERE referrer_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Update the referrals table structure
-- Remove the unique constraint on referral_code since multiple referrals can use the same code
ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_referral_code_key;

-- Add index instead
CREATE INDEX IF NOT EXISTS idx_referrals_code_nonunique ON referrals(referral_code);

-- Clean up old base referrals that have no referred user
DELETE FROM referrals WHERE referred_user_id IS NULL AND referred_email IS NULL;
