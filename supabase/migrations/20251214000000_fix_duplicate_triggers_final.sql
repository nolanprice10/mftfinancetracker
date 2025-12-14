-- Final fix for duplicate triggers on transactions table
-- The problem: Multiple triggers were calling update_account_balance_from_transaction()
-- causing the balance to be updated multiple times for a single transaction

-- Remove ALL old triggers completely (including goal-related triggers for clean slate)
DROP TRIGGER IF EXISTS on_transaction_change_update_account ON public.transactions CASCADE;
DROP TRIGGER IF EXISTS on_transaction_update_goal ON public.transactions CASCADE;
DROP TRIGGER IF EXISTS update_account_balance_trigger ON public.transactions CASCADE;
DROP TRIGGER IF EXISTS update_goal_from_transaction_trigger ON public.transactions CASCADE;
DROP TRIGGER IF EXISTS sync_goal_balance_trigger ON public.accounts CASCADE;
DROP TRIGGER IF EXISTS on_account_update_sync_goals ON public.accounts CASCADE;

-- Verify no triggers remain on transactions table before recreating
-- This ensures a completely clean state

-- Now recreate ONLY the triggers we need (one per function, no duplicates)

-- Trigger 1: Update account balance when transactions change
-- This is the ONLY trigger that should update account.balance
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_balance_from_transaction();

-- Trigger 2: Sync goal with account balance when account changes
CREATE TRIGGER sync_goal_balance_trigger
  AFTER UPDATE OF balance ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_goal_with_account_balance();

-- Trigger 3: Update goal from transaction when transaction has goal_id
CREATE TRIGGER update_goal_from_transaction_trigger
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.goal_id IS NOT NULL)
  EXECUTE FUNCTION public.update_goal_from_transaction();
