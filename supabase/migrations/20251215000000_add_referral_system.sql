-- Create referrals table to track who invited whom
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL UNIQUE,
  referred_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_granted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT unique_referrer_referred UNIQUE (referrer_id, referred_user_id)
);

-- Create user_rewards table to track unlocked features
CREATE TABLE IF NOT EXISTS user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type text NOT NULL CHECK (reward_type IN ('feature_unlock', 'bonus_credits')),
  reward_description text NOT NULL,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  granted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_user_rewards_user ON user_rewards(user_id);
CREATE INDEX idx_user_rewards_active ON user_rewards(is_active);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals table
CREATE POLICY "Users can view their own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals where they were referred"
  ON referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referred_user_id);

CREATE POLICY "Users can create their own referral codes"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update their own referrals"
  ON referrals FOR UPDATE
  TO authenticated
  USING (auth.uid() = referrer_id);

-- RLS Policies for user_rewards table
CREATE POLICY "Users can view their own rewards"
  ON user_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert rewards"
  ON user_rewards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards"
  ON user_rewards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = code) INTO exists;
    
    -- If doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Function to handle completed referrals and grant rewards
CREATE OR REPLACE FUNCTION handle_completed_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If referral just completed and reward not yet granted
  IF NEW.status = 'completed' AND OLD.status = 'pending' AND NEW.reward_granted = false THEN
    -- Mark reward as granted
    UPDATE referrals 
    SET reward_granted = true, completed_at = now() 
    WHERE id = NEW.id;
    
    -- Count completed referrals for the referrer
    DECLARE
      referral_count integer;
    BEGIN
      SELECT COUNT(*) INTO referral_count
      FROM referrals
      WHERE referrer_id = NEW.referrer_id 
        AND status = 'completed';
      
      -- Grant reward based on milestones
      IF referral_count = 1 THEN
        -- First referral: Custom themes
        INSERT INTO user_rewards (user_id, reward_type, reward_description, expires_at)
        VALUES (
          NEW.referrer_id,
          'feature_unlock',
          'Custom Themes Unlocked - Access to 6 premium color schemes!',
          NULL -- No expiration
        );
      ELSIF referral_count = 3 THEN
        -- Third referral: Advanced analytics and export
        INSERT INTO user_rewards (user_id, reward_type, reward_description, expires_at)
        VALUES (
          NEW.referrer_id,
          'feature_unlock',
          'Advanced Analytics + Data Export Unlocked - You've referred 3 friends!',
          NULL -- No expiration
        );
      ELSIF referral_count >= 5 THEN
        -- Fifth+ referral: All advanced features
        INSERT INTO user_rewards (user_id, reward_type, reward_description, expires_at)
        VALUES (
          NEW.referrer_id,
          'feature_unlock',
          'All Advanced Features Unlocked Forever - Amazing work referring 5+ friends!',
          NULL -- No expiration
        );
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically grant rewards when referrals complete
CREATE TRIGGER trigger_completed_referral
  AFTER UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION handle_completed_referral();

-- Function to check if user was referred and mark referral complete
CREATE OR REPLACE FUNCTION check_and_complete_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if there's a pending referral for this user's email
  UPDATE referrals
  SET 
    referred_user_id = NEW.id,
    status = 'completed',
    completed_at = now()
  WHERE 
    referred_email = NEW.email
    AND status = 'pending'
    AND referred_user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Trigger to complete referral when referred user signs up
CREATE TRIGGER trigger_check_referral_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION check_and_complete_referral();
