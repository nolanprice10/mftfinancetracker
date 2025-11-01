-- Fix security vulnerabilities

-- 1. Fix search_path in all SECURITY DEFINER functions (remove quotes)
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
  -- Handle DELETE
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
    
    UPDATE public.accounts
    SET balance = balance + new_amount
    WHERE id = NEW.account_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Fix other SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_goal_with_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.goals
  SET current_amount = NEW.balance
  WHERE account_id = NEW.id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_goal_from_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  goal_account_id uuid;
BEGIN
  IF NEW.goal_id IS NOT NULL THEN
    SELECT account_id INTO goal_account_id
    FROM public.goals
    WHERE id = NEW.goal_id;
    
    IF goal_account_id = NEW.account_id OR goal_account_id IS NULL THEN
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

-- 2. Add DELETE policy for profiles table (GDPR compliance)
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);