-- Check what tables exist in your database
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;

-- Check specifically for profiles or users table
SELECT table_name, column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'users')
ORDER BY table_name, ordinal_position;
