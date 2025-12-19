export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string | null;
  referral_code: string;
  referred_email: string | null;
  status: 'pending' | 'completed' | 'expired';
  reward_granted: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface UserReferralCode {
  id: string;
  user_id: string;
  referral_code: string;
  created_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_type: 'feature_unlock' | 'bonus_credits';
  reward_description: string;
  expires_at: string | null;
  is_active: boolean;
  granted_at: string;
  created_at: string;
}
