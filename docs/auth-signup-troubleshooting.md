## Fix "Database error saving new user" during sign up

This error is returned by Supabase Auth (GoTrue) when the authentication server cannot commit the user record to Postgres. The most common causes are:

- A trigger on auth.users that fails (often a custom trigger that tries to insert into public.users/profiles and hits RLS/constraints)
- RLS or constraints on a related table that a trigger writes to
- Missing/invalid Supabase project URL or anon key (less common for this specific message)
- Database paused/out of quota (transient)

Below are fast checks and fixes.

### 1) Quick project checks

- Verify environment values in `.env.local` point to the correct project:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (needed for some server routes like uploads)
- In the Supabase Dashboard → Authentication → Providers, ensure Email/Password is enabled and Signups are allowed.
- Check Auth → Logs at the exact time of the failure for a detailed DB error (constraint/RLS message).

### 2) Look for failing triggers on auth.users

Run this in Supabase SQL editor to see any triggers on auth.users:

```sql
select
  t.tgname as trigger_name,
  p.proname as function_name,
  n.nspname as function_schema,
  pg_get_triggerdef(t.oid) as trigger_def
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
join pg_namespace n on n.oid = p.pronamespace
where t.tgrelid = 'auth.users'::regclass
  and not t.tgisinternal;
```

If you see a trigger that inserts into `public.users`/`public.profiles`, it likely fails due to RLS or constraints. You have two safe options:

#### Option A: Temporarily drop the custom trigger (quick unblock)

```sql
-- Replace my_trigger_name with the name you saw above
drop trigger if exists my_trigger_name on auth.users;
```

Sign up again to confirm it works. You can re‑introduce a fixed trigger later.

#### Option B: Recreate the trigger function with SECURITY DEFINER and safe insert

This pattern inserts a row into a profiles/users table without hitting RLS problems. Adjust table/columns to your schema (this repo defines a public.users table with id/email).

```sql
-- 1) Ensure target table exists (example for public.users)
create table if not exists public.users (
  id uuid primary key,
  email text,
  created_at timestamptz default now()
);

-- 2) Create a function that runs with elevated privileges
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert if missing; ignore on conflict
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3) Attach AFTER INSERT trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 4) (Optional) Enable RLS and add minimal policies on public.users
alter table public.users enable row level security;
do $$ begin
  begin
    create policy "users_self_read" on public.users
      for select using (id = auth.uid());
  exception when duplicate_object then null; end;
  begin
    create policy "users_self_insert" on public.users
      for insert with check (id = auth.uid());
  exception when duplicate_object then null; end;
  begin
    create policy "users_self_update" on public.users
      for update using (id = auth.uid());
  exception when duplicate_object then null; end;
end $$;
```

Notes:

- The SECURITY DEFINER function runs as its owner (typically postgres), avoiding RLS issues inside the function.
- We still add RLS policies for normal client access later; the trigger function itself bypasses RLS.

### 3) Check constraints that could fail

If your trigger writes into another table, ensure:

- Unique constraints aren’t violated (e.g., a unique email already exists)
- Required columns have defaults or are set in the function

### 4) Verify after fix

Try signing up again from `/auth`. If successful, you’ll be redirected to the dashboard and your store will auto‑create.

If it still fails:

- Copy the exact DB error from Auth → Logs
- Share the trigger/function definitions you have on auth.users

### 5) Optional diagnostics endpoint

You can temporarily create a diagnostic route that uses the service role to list users to confirm keys are correct:

```ts
// app/api/debug-auth/route.ts (temporary)
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  if (error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  return NextResponse.json({ ok: true, sample: data.users?.length ?? 0 });
}
```

Remove this route after debugging.

---

If you want help tailoring the SQL to your exact schema, paste your current trigger(s) on auth.users and the full error from Auth → Logs.
