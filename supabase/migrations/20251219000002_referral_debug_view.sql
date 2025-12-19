-- Add a helpful view to debug referrals
CREATE OR REPLACE VIEW referral_debug_view AS
SELECT 
  urc.user_id as referrer_id,
  urc.referral_code,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'completed') as completed_referrals,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'pending') as pending_referrals,
  COUNT(DISTINCT uw.id) as total_rewards,
  array_agg(DISTINCT r.referred_email) FILTER (WHERE r.referred_email IS NOT NULL) as referred_emails
FROM user_referral_codes urc
LEFT JOIN referrals r ON r.referral_code = urc.referral_code
LEFT JOIN user_rewards uw ON uw.user_id = urc.user_id AND uw.is_active = true
GROUP BY urc.user_id, urc.referral_code;

-- Grant access to authenticated users (only for their own data via RLS)
GRANT SELECT ON referral_debug_view TO authenticated;

-- Add RLS for the view
ALTER VIEW referral_debug_view SET (security_invoker = true);
