-- Add birthday field to profiles table
ALTER TABLE public.profiles
ADD COLUMN birthday DATE;

-- Add annual_apy to investments table for savings accounts
ALTER TABLE public.investments
ADD COLUMN annual_apy NUMERIC DEFAULT 0;

-- Add source_account_id to track which account funded the investment
ALTER TABLE public.investments
ADD COLUMN source_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;