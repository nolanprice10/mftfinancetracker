-- Improved referral system with better duplicate handling
-- This migration improves the referral reward granting logic

-- Function to handle completed referrals and grant rewards
CREATE OR REPLACE FUNCTION handle_completed_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referral_count integer;
  reward_description_text text;
BEGIN
  -- Only process if referral just completed
  IF NEW.status = 'completed' AND (OLD.status = 'pending' OR OLD.status IS NULL) THEN
    
    -- Count completed referrals for the referrer
    SELECT COUNT(*) INTO referral_count
    FROM referrals
    WHERE referrer_id = NEW.referrer_id 
      AND status = 'completed';
    
    -- Determine which reward to grant based on milestone
    reward_description_text := NULL;
    
    IF referral_count = 1 THEN
      reward_description_text := 'Custom Themes Unlocked - Access to 6 premium color schemes!';
    ELSIF referral_count = 3 THEN
      reward_description_text := 'Advanced Analytics + Data Export Unlocked - You''ve referred 3 friends!';
    ELSIF referral_count = 5 THEN
      reward_description_text := 'All Advanced Features Unlocked Forever - Amazing work referring 5+ friends!';
    END IF;
    
    -- Only insert reward if we hit a milestone and it doesn't already exist
    IF reward_description_text IS NOT NULL THEN
      INSERT INTO user_rewards (user_id, reward_type, reward_description, expires_at)
      VALUES (
        NEW.referrer_id,
        'feature_unlock',
        reward_description_text,
        NULL
      )
      ON CONFLICT DO NOTHING; -- Prevent duplicate rewards
      
      -- Also mark the reward as granted on this referral
      UPDATE referrals 
      SET reward_granted = true, completed_at = COALESCE(NEW.completed_at, now())
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add unique constraint to prevent duplicate rewards for same user
-- First, remove any existing duplicates
DELETE FROM user_rewards a
USING user_rewards b
WHERE a.id < b.id 
  AND a.user_id = b.user_id 
  AND a.reward_description = b.reward_description;

-- Then create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_rewards_unique 
  ON user_rewards(user_id, reward_description)
  WHERE is_active = true;
