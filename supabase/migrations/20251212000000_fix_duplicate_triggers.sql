-- Fix duplicate triggers on transactions table
-- Remove old trigger that was not properly cleaned up
DROP TRIGGER IF EXISTS on_transaction_change_update_account ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_update_goal ON public.transactions;

-- Ensure only the latest triggers exist
-- The update_account_balance_trigger and update_goal_from_transaction_trigger should be the only ones
