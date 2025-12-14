-- Remove debug artifacts: drop debug table and replace function with clean version

-- Drop the debug table and all data
DROP TABLE IF EXISTS public.trigger_debug_log CASCADE;

-- Replace function with clean version (no debug logging)
CREATE OR REPLACE FUNCTION public.update_account_balance_from_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_amount NUMERIC := 0;
  new_amount NUMERIC := 0;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.type = 'income' THEN
      old_amount := -OLD.amount;
    ELSE
      old_amount := OLD.amount;
    END IF;
    UPDATE public.accounts
    SET balance = balance + old_amount
    WHERE id = OLD.account_id;
    RETURN OLD;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.type = 'income' THEN
      old_amount := -OLD.amount;
    ELSE
      old_amount := OLD.amount;
    END IF;
    IF NEW.type = 'income' THEN
      new_amount := NEW.amount;
    ELSE
      new_amount := -NEW.amount;
    END IF;
    UPDATE public.accounts
    SET balance = balance + old_amount + new_amount
    WHERE id = NEW.account_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'income' THEN
      new_amount := NEW.amount;
    ELSE
      new_amount := -NEW.amount;
    END IF;
    UPDATE public.accounts
    SET balance = balance + new_amount
    WHERE id = NEW.account_id;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;