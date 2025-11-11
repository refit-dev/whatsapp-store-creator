-- Fix RLS policies for whatsapp_verifications to include store owners
-- The previous policies only checked store_members, but owners might not be in that table

-- Drop ALL possible policy names (old and new)
drop policy if exists whatsapp_verif_select on public.whatsapp_verifications;
drop policy if exists whatsapp_verif_upsert on public.whatsapp_verifications;
drop policy if exists whatsapp_verif_insert on public.whatsapp_verifications;
drop policy if exists whatsapp_verif_update on public.whatsapp_verifications;

-- Create new policies that check both store ownership AND store_members

-- SELECT policy: Allow store owners OR members with owner/admin role
create policy whatsapp_verif_select on public.whatsapp_verifications
  for select using (
    exists (
      select 1 from public.stores s
      where s.id = whatsapp_verifications.store_id
        and s.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from public.store_members m
      where m.store_id = whatsapp_verifications.store_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

-- INSERT policy: Allow store owners OR members with owner/admin role
create policy whatsapp_verif_insert on public.whatsapp_verifications
  for insert with check (
    exists (
      select 1 from public.stores s
      where s.id = whatsapp_verifications.store_id
        and s.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from public.store_members m
      where m.store_id = whatsapp_verifications.store_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

-- UPDATE policy: Allow store owners OR members with owner/admin role
create policy whatsapp_verif_update on public.whatsapp_verifications
  for update using (
    exists (
      select 1 from public.stores s
      where s.id = whatsapp_verifications.store_id
        and s.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from public.store_members m
      where m.store_id = whatsapp_verifications.store_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );
