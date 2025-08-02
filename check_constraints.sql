SELECT conname, conrelid::regclass as table_name 
FROM pg_constraint 
WHERE confrelid = (SELECT oid FROM pg_class WHERE relname = 'users');