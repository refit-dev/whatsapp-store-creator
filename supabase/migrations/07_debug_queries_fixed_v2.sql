-- Debug queries for demo-bakes store and products
DO $$
DECLARE
  _store_id UUID;
  _count INT;
  _result TEXT;
  _row RECORD;
BEGIN
  -- Check store_public view
  RAISE NOTICE 'Checking store_public:';
  SELECT id INTO _store_id FROM store_public WHERE handle = 'demo-bakes';
  IF NOT FOUND THEN
    RAISE NOTICE 'Store not found in store_public view';
    RETURN;
  END IF;
  RAISE NOTICE 'Found store: %', _store_id;

  -- Check products
  RAISE NOTICE 'Checking products for store %:', _store_id;
  SELECT COUNT(*) INTO _count
  FROM products p
  JOIN stores s ON s.id = p.store_id
  WHERE s.handle = 'demo-bakes'
  AND p.is_active = true;
  RAISE NOTICE 'Active product count: %', _count;

  -- List products
  RAISE NOTICE 'Product details:';
  FOR _row IN (
    SELECT p.title, p.price_cents, p.is_active, p.store_id
    FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE s.handle = 'demo-bakes'
    ORDER BY p.created_at DESC
  ) LOOP
    RAISE NOTICE 'Title: %, Price: %, Active: %, Store: %', 
      _row.title, _row.price_cents, _row.is_active, _row.store_id;
  END LOOP;

  -- Check RLS setup
  RAISE NOTICE 'Checking RLS policies:';
  SELECT format(
    'Products RLS enabled: %s, Store RLS enabled: %s',
    (SELECT rls_enabled FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'products'),
    (SELECT rls_enabled FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'stores')
  ) INTO _result;
  RAISE NOTICE '%', _result;

  -- List policies
  SELECT format(
    'Product policies: %s',
    string_agg(polname, ', ')
  ) INTO _result
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'products';
  RAISE NOTICE '%', _result;

  -- Check store_public permissions
  RAISE NOTICE 'Checking store_public permissions:';
  SELECT format(
    'Permissions: %s',
    array_to_string(array_agg(privilege_type), ', ')
  ) INTO _result
  FROM information_schema.role_table_grants
  WHERE table_name = 'store_public'
  AND grantee = 'anon';
  RAISE NOTICE '%', _result;

  -- Check if anon can read products
  RAISE NOTICE 'Checking product read permissions for anon:';
  SELECT format(
    'Product read permissions: %s',
    array_to_string(array_agg(privilege_type), ', ')
  ) INTO _result
  FROM information_schema.role_table_grants
  WHERE table_name = 'products'
  AND grantee = 'anon';
  RAISE NOTICE '%', _result;

  -- Check auth.uid() availability
  BEGIN
    EXECUTE 'SELECT auth.uid()' INTO _result;
    RAISE NOTICE 'Current auth.uid(): %', _result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'auth.uid() not available or null';
  END;
END $$;