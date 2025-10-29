-- Add account_id to goals table for automatic tracking
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- Create trigger function to update goals when transactions occur
CREATE OR REPLACE FUNCTION public.update_goal_from_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  goal_account_id uuid;
BEGIN
  -- Check if transaction has a linked goal
  IF NEW.goal_id IS NOT NULL THEN
    -- Get the account_id for this goal
    SELECT account_id INTO goal_account_id
    FROM public.goals
    WHERE id = NEW.goal_id;
    
    -- Only update if goal is linked to the same account as transaction
    IF goal_account_id = NEW.account_id OR goal_account_id IS NULL THEN
      -- Update goal current_amount
      IF NEW.type = 'income' THEN
        UPDATE public.goals
        SET current_amount = current_amount + NEW.amount
        WHERE id = NEW.goal_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for goal updates on transaction insert
DROP TRIGGER IF EXISTS on_transaction_update_goal ON public.transactions;
CREATE TRIGGER on_transaction_update_goal
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_from_transaction();