-- Fix 1: Add DELETE policy for risk_profiles table
CREATE POLICY "Users can delete own risk profile"
ON public.risk_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Fix 2: Update sync_goal_with_account_balance function to handle overall goals
CREATE OR REPLACE FUNCTION public.sync_goal_with_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_total_balance NUMERIC;
BEGIN
  -- Update account-specific goals
  UPDATE public.goals
  SET current_amount = NEW.balance
  WHERE account_id = NEW.id;
  
  -- Calculate total balance for this user across all accounts
  SELECT COALESCE(SUM(balance), 0) INTO user_total_balance
  FROM public.accounts
  WHERE user_id = NEW.user_id;
  
  -- Update overall goals (account_id IS NULL) for this user
  UPDATE public.goals
  SET current_amount = user_total_balance
  WHERE user_id = NEW.user_id 
    AND account_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Add index to optimize the SUM query for overall goals
CREATE INDEX IF NOT EXISTS idx_accounts_user_balance 
  ON public.accounts(user_id, balance);