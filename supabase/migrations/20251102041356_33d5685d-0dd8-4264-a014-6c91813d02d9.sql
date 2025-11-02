-- Add 'individual_stock' to investment_type enum
ALTER TYPE investment_type ADD VALUE IF NOT EXISTS 'individual_stock';

-- Ensure risk_profiles recommended_profile can be set properly
-- The constraint is already correct, but we'll recreate it to ensure consistency
ALTER TABLE public.risk_profiles DROP CONSTRAINT IF EXISTS risk_profiles_recommended_profile_check;
ALTER TABLE public.risk_profiles ADD CONSTRAINT risk_profiles_recommended_profile_check 
  CHECK (recommended_profile IN ('conservative', 'moderate', 'aggressive'));