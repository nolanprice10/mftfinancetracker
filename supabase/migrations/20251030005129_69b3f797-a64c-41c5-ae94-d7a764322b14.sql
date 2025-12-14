-- Add stock-specific fields to investments table
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS ticker_symbol text,
ADD COLUMN IF NOT EXISTS shares_owned numeric,
ADD COLUMN IF NOT EXISTS purchase_price_per_share numeric;

-- Update the trigger function to sync goal current_amount with account balance
CREATE OR REPLACE FUNCTION public.sync_goal_with_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all goals linked to this account with the new balance
  UPDATE public.goals
  SET current_amount = NEW.balance
  WHERE account_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for syncing goals when account balance changes
-- DISABLED: This trigger is now properly created in migration 20251214000000
-- DROP TRIGGER IF EXISTS on_account_update_sync_goals ON public.accounts;
-- CREATE TRIGGER on_account_update_sync_goals
--   AFTER INSERT OR UPDATE OF balance ON public.accounts
--   FOR EACH ROW
--   EXECUTE FUNCTION public.sync_goal_with_account_balance();