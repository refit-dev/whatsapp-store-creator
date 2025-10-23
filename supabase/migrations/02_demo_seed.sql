-- Demo seed: 1 user, 1 store, 3 products
-- Notes:
--  - Some environments may have a stores.owner_id FK pointing to auth.users instead of public.users.
--    To avoid FK issues during seeding, we omit owner_id (NULL is allowed) and skip store_members here.
--  - Inserts are idempotent using ON CONFLICT DO NOTHING so this file can be re-run safely.

-- Seed a demo user in public.users (not required for storefront to work, but handy for local dev)
INSERT INTO public.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@store.com')
ON CONFLICT (id) DO NOTHING;

-- Conditionally seed store, membership, and products only if a valid owner exists
DO $$
DECLARE 
  _owner UUID;
  _store UUID := '00000000-0000-0000-0000-000000000010'::uuid;
  _ref_schema TEXT;
  _ref_table TEXT;
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
    -- Fallback to public.users if FK lookup failed
    _ref_schema := 'public';
    _ref_table := 'users';
  END IF;

  -- Pick any existing user from the referenced table
  EXECUTE format('SELECT id FROM %I.%I LIMIT 1', _ref_schema, _ref_table) INTO _owner;

  IF _owner IS NULL THEN
    RAISE NOTICE 'Skipping Demo Store seed: no users found in %.% to assign as owner_id.', _ref_schema, _ref_table;
    RETURN;
  END IF;

  -- Insert store
  INSERT INTO public.stores (id, owner_id, handle, name, logo_url, banner_url, whatsapp_e164, currency, is_payments_enabled, payment_provider)
  VALUES (_store, _owner, 'demo', 'Demo Store', NULL, NULL, '919999999999', 'INR', true, 'stripe')
  ON CONFLICT (id) DO NOTHING;

  -- Insert membership and products only if store exists
  IF EXISTS (SELECT 1 FROM public.stores WHERE id = _store) THEN
    INSERT INTO public.store_members (store_id, user_id, role)
    VALUES (_store, _owner, 'owner')
    ON CONFLICT (store_id, user_id) DO NOTHING;

    INSERT INTO public.products (id, store_id, title, description, price_cents, currency, image_urls, variants, is_active, stock_qty)
    VALUES
      ('00000000-0000-0000-0000-000000000100', _store, 'Product 1', 'First demo product', 1999, 'INR', '["/icons/icon-192.png"]', '[]', true, 10),
      ('00000000-0000-0000-0000-000000000101', _store, 'Product 2', 'Second demo product', 2999, 'INR', '["/icons/icon-192.png"]', '[]', true, 5),
      ('00000000-0000-0000-0000-000000000102', _store, 'Product 3', 'Third demo product', 3999, 'INR', '["/icons/icon-192.png"]', '[]', true, 2)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
