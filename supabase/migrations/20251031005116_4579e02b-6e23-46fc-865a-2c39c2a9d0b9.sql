-- Add trigger to automatically update account balance when transactions are added/updated/deleted
CREATE OR REPLACE FUNCTION public.update_account_balance_from_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Create trigger for transaction changes
DROP TRIGGER IF EXISTS on_transaction_change_update_account ON public.transactions;
CREATE TRIGGER on_transaction_change_update_account
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_balance_from_transaction();

-- Add spending_limits table for daily/weekly/monthly limits
CREATE TABLE IF NOT EXISTS public.spending_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  limit_amount NUMERIC NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.spending_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spending limits"
  ON public.spending_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own spending limits"
  ON public.spending_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spending limits"
  ON public.spending_limits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spending limits"
  ON public.spending_limits FOR DELETE
  USING (auth.uid() = user_id);

-- Add risk_profiles table for risk assessment
CREATE TABLE IF NOT EXISTS public.risk_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_tolerance TEXT CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  risk_capacity TEXT CHECK (risk_capacity IN ('low', 'medium', 'high')),
  recommended_profile TEXT CHECK (recommended_profile IN ('conservative', 'moderate', 'aggressive')),
  quiz_responses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.risk_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own risk profile"
  ON public.risk_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own risk profile"
  ON public.risk_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own risk profile"
  ON public.risk_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Add onboarding_progress table
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  steps_completed JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding progress"
  ON public.onboarding_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own onboarding progress"
  ON public.onboarding_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress"
  ON public.onboarding_progress FOR UPDATE
  USING (auth.uid() = user_id);