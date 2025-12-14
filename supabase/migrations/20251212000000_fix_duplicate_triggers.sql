-- Fix duplicate triggers on transactions table
-- DISABLED: This migration is superseded by 20251214000000_fix_duplicate_triggers_final.sql
-- The problem: Multiple triggers were calling update_account_balance_from_transaction()
-- causing the balance to be updated multiple times for a single transaction

-- This migration has been disabled to prevent duplicate trigger creation
-- All trigger management is now handled in the 20251214000000 migration
