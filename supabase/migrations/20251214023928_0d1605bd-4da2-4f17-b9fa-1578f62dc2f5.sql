-- Drop all existing triggers on transactions and accounts
DROP TRIGGER IF EXISTS on_transaction_change_update_account ON public.transactions CASCADE;
DROP TRIGGER IF EXISTS on_transaction_update_goal ON public.transactions CASCADE;
DROP TRIGGER IF EXISTS update_account_balance_trigger ON public.transactions CASCADE;
DROP TRIGGER IF EXISTS update_goal_from_transaction_trigger ON public.transactions CASCADE;
DROP TRIGGER IF EXISTS sync_goal_balance_trigger ON public.accounts CASCADE;
DROP TRIGGER IF EXISTS on_account_update_sync_goals ON public.accounts CASCADE;

-- Create trigger for updating account balance when transactions change
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_balance_from_transaction();

-- Create trigger for syncing goal balance when account balance changes
CREATE TRIGGER sync_goal_balance_trigger
  AFTER UPDATE OF balance ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_goal_with_account_balance();

-- Create trigger for updating goal from transaction (only on INSERT when goal_id is set)
CREATE TRIGGER update_goal_from_transaction_trigger
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.goal_id IS NOT NULL)
  EXECUTE FUNCTION public.update_goal_from_transaction();