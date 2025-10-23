-- Ensure a demo user exists to satisfy NOT NULL owner_id in some schemas
INSERT INTO public.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@store.com')
ON CONFLICT (id) DO NOTHING;

-- Seed a public demo store 'demo-bakes' with an owner
DO $$
DECLARE 
  _owner UUID;
  _store UUID := '00000000-0000-0000-0000-000000000020'::uuid;
  _ref_schema TEXT;
  _ref_table TEXT;
  _store_exists BOOLEAN := false;
BEGIN
  -- Detect which table the FK on stores.owner_id points to
  SELECT rn.nspname, r.relname
  INTO _ref_schema, _ref_table
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attname = 'owner_id' AND a.attnum = ANY (c.conkey)
  JOIN pg_class r ON r.oid = c.confrelid
  JOIN pg_namespace rn ON rn.oid = r.relnamespace
  WHERE n.nspname = 'public' AND t.relname = 'stores' AND c.contype = 'f'
  LIMIT 1;

  IF _ref_schema IS NULL THEN
    _ref_schema := 'public';
    _ref_table := 'users';
  END IF;

  EXECUTE format('SELECT id FROM %I.%I LIMIT 1', _ref_schema, _ref_table) INTO _owner;

  -- Prefer existing store id by handle if present
  SELECT id INTO _store FROM public.stores WHERE handle = 'demo-bakes' LIMIT 1;
  _store_exists := FOUND;
  IF NOT _store_exists THEN
    -- fall back to known UUID and check existence by id
    _store := '00000000-0000-0000-0000-000000000020'::uuid;
    SELECT EXISTS (SELECT 1 FROM public.stores WHERE id = _store) INTO _store_exists;
  END IF;

  IF _owner IS NULL AND NOT _store_exists THEN
    RAISE NOTICE 'Skipping Demo Bakes seed: no users found in %.% to assign as owner_id, and store does not exist.', _ref_schema, _ref_table;
    RETURN;
  END IF;

  -- Insert store
  IF NOT _store_exists AND _owner IS NOT NULL THEN
    INSERT INTO public.stores (
      id, owner_id, handle, name, logo_url, banner_url, whatsapp_e164, currency, is_payments_enabled, payment_provider
    ) VALUES (
      _store, _owner, 'demo-bakes', 'Demo Bakes', NULL, NULL, '919999999999', 'INR', false, 'none'
    ) ON CONFLICT (handle) DO NOTHING;
    -- Refresh store id from handle in case a different id already existed
    SELECT id INTO _store FROM public.stores WHERE handle = 'demo-bakes' LIMIT 1;
    _store_exists := FOUND;
  END IF;

  -- Insert membership (only if owner known) and products if store exists
  IF _store_exists THEN
    IF _owner IS NOT NULL THEN
      INSERT INTO public.store_members (store_id, user_id, role)
      VALUES (_store, _owner, 'owner')
      ON CONFLICT (store_id, user_id) DO NOTHING;
    END IF;

    INSERT INTO public.products (
      id, store_id, title, description, price_cents, currency, image_urls, variants, is_active, stock_qty
    ) VALUES
      (
        '00000000-0000-0000-0000-000000000200',
        _store,
        'Sourdough Loaf',
        'Crusty, slow-fermented classic sourdough.',
        2499,
        'INR',
        '["/icons/icon-192.png"]',
        '[]',
        true,
        25
      ),
      (
        '00000000-0000-0000-0000-000000000201',
        _store,
        'Chocolate Croissant',
        'Flaky pastry with rich chocolate.',
        1499,
        'INR',
        '["/icons/icon-192.png"]',
        '[]',
        true,
        50
      )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
