-- Add logging to the trigger function to debug the double subtraction issue
CREATE OR REPLACE FUNCTION public.update_account_balance_from_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_amount NUMERIC := 0;
  new_amount NUMERIC := 0;
  current_balance NUMERIC;
  log_entry text;
BEGIN
  -- Get current balance for logging
  SELECT balance INTO current_balance FROM public.accounts WHERE id = COALESCE(NEW.account_id, OLD.account_id);
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.type = 'income' THEN
      old_amount := -OLD.amount;
    ELSE
      old_amount := OLD.amount;
    END IF;
    
    RAISE NOTICE 'DELETE: Current balance: %, Adjustment: %, New balance will be: %', current_balance, old_amount, current_balance + old_amount;
    
    UPDATE public.accounts
    SET balance = balance + old_amount
    WHERE id = OLD.account_id;
    
    RETURN OLD;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Revert old transaction impact
    IF OLD.type = 'income' THEN
      old_amount := -OLD.amount;
    ELSE
      old_amount := OLD.amount;
    END IF;
    
    -- Apply new transaction impact
    IF NEW.type = 'income' THEN
      new_amount := NEW.amount;
    ELSE
      new_amount := -NEW.amount;
    END IF;
    
    RAISE NOTICE 'UPDATE: Current balance: %, Old adjustment: %, New adjustment: %, Total adjustment: %, New balance will be: %', 
                 current_balance, old_amount, new_amount, old_amount + new_amount, current_balance + old_amount + new_amount;
    
    UPDATE public.accounts
    SET balance = balance + old_amount + new_amount
    WHERE id = NEW.account_id;
    
    RETURN NEW;
  END IF;
  
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'income' THEN
      new_amount := NEW.amount;
    ELSE
      new_amount := -NEW.amount;
    END IF;
    
    -- Log to a table instead of NOTICE
    log_entry := format('INSERT tx_id=%s type=%s amount=%s curr_bal=%s adj=%s new_bal=%s', 
                        NEW.id, NEW.type, NEW.amount, current_balance, new_amount, current_balance + new_amount);
    RAISE WARNING 'TRIGGER_LOG: %', log_entry;
    
    UPDATE public.accounts
    SET balance = balance + new_amount
    WHERE id = NEW.account_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create a simple log table to track trigger calls
CREATE TABLE IF NOT EXISTS public.trigger_debug_log (
  id SERIAL PRIMARY KEY,
  log_time TIMESTAMP DEFAULT NOW(),
  operation TEXT,
  transaction_id UUID,
  account_id UUID,
  amount NUMERIC,
  balance_before NUMERIC,
  balance_after NUMERIC
);

-- Update the function to log to the table
CREATE OR REPLACE FUNCTION public.update_account_balance_from_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_amount NUMERIC := 0;
  new_amount NUMERIC := 0;
  current_balance NUMERIC;
  new_balance NUMERIC;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance FROM public.accounts WHERE id = COALESCE(NEW.account_id, OLD.account_id);
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.type = 'income' THEN
      old_amount := -OLD.amount;
    ELSE
      old_amount := OLD.amount;
    END IF;
    
    UPDATE public.accounts
    SET balance = balance + old_amount
    WHERE id = OLD.account_id
    RETURNING balance INTO new_balance;
    
    INSERT INTO public.trigger_debug_log (operation, transaction_id, account_id, amount, balance_before, balance_after)
    VALUES ('DELETE', OLD.id, OLD.account_id, OLD.amount, current_balance, new_balance);
    
    RETURN OLD;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Revert old transaction impact
    IF OLD.type = 'income' THEN
      old_amount := -OLD.amount;
    ELSE
      old_amount := OLD.amount;
    END IF;
    
    -- Apply new transaction impact
    IF NEW.type = 'income' THEN
      new_amount := NEW.amount;
    ELSE
      new_amount := -NEW.amount;
    END IF;
    
    UPDATE public.accounts
    SET balance = balance + old_amount + new_amount
    WHERE id = NEW.account_id
    RETURNING balance INTO new_balance;
    
    INSERT INTO public.trigger_debug_log (operation, transaction_id, account_id, amount, balance_before, balance_after)
    VALUES ('UPDATE', NEW.id, NEW.account_id, NEW.amount, current_balance, new_balance);
    
    RETURN NEW;
  END IF;
  
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'income' THEN
      new_amount := NEW.amount;
    ELSE
      new_amount := -NEW.amount;
    END IF;
    
    UPDATE public.accounts
    SET balance = balance + new_amount
    WHERE id = NEW.account_id
    RETURNING balance INTO new_balance;
    
    INSERT INTO public.trigger_debug_log (operation, transaction_id, account_id, amount, balance_before, balance_after)
    VALUES ('INSERT', NEW.id, NEW.account_id, NEW.amount, current_balance, new_balance);
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;
