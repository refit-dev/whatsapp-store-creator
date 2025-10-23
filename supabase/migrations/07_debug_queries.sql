-- Debug queries for demo-bakes store and products
DO $$
DECLARE
  _store_id UUID;
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
  RAISE NOTICE 'Checking products:';
  WITH prod_check AS (
    SELECT p.*, s.handle 
    FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE s.handle = 'demo-bakes'
    AND p.is_active = true
  )
  SELECT json_agg(prod_check.*) INTO _store_id FROM prod_check;
  RAISE NOTICE 'Products: %', _store_id;

  -- Check RLS setup
  RAISE NOTICE 'Checking RLS policies:';
  SELECT format(
    'Products RLS enabled: %s, Store RLS enabled: %s',
    (SELECT rls_enabled FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'products'),
    (SELECT rls_enabled FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'stores')
  ) INTO _store_id;
  RAISE NOTICE '%', _store_id;

  -- List policies
  SELECT format(
    'Product policies: %s',
    string_agg(polname, ', ')
  ) INTO _store_id
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'products';
  RAISE NOTICE '%', _store_id;
END $$;