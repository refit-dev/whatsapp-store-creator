-- Create table to manage WhatsApp number OTP verification per store
create table if not exists public.whatsapp_verifications (
  store_id uuid primary key references public.stores(id) on delete cascade,
  phone_e164 text not null,
  otp_code text not null,
  expires_at timestamptz not null,
  verified_at timestamptz null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

-- Helpful index for expiry checks
create index if not exists idx_whatsapp_verifications_expires_at
  on public.whatsapp_verifications(expires_at);

-- Optional: enable RLS and restrict via policies
alter table public.whatsapp_verifications enable row level security;

-- Only allow owners/admins of the store to manage their verification rows
create policy if not exists whatsapp_verif_select on public.whatsapp_verifications
  for select using (
    exists (
      select 1 from public.store_members m
      where m.store_id = whatsapp_verifications.store_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

create policy if not exists whatsapp_verif_upsert on public.whatsapp_verifications
  for insert with check (
    exists (
      select 1 from public.store_members m
      where m.store_id = whatsapp_verifications.store_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

create policy if not exists whatsapp_verif_update on public.whatsapp_verifications
  for update using (
    exists (
      select 1 from public.store_members m
      where m.store_id = whatsapp_verifications.store_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );
