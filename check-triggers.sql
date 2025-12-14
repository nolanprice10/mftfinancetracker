-- Check what triggers exist on transactions table
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    tgenabled AS enabled,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger 
WHERE tgrelid IN ('public.transactions'::regclass, 'public.accounts'::regclass)
  AND tgname NOT LIKE 'pg_%'
ORDER BY tgrelid, tgname;
