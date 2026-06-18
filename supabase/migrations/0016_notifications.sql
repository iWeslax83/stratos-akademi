create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mesaj text not null,
  link text,
  okundu boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_user on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notif kendi okur" on public.notifications
  for select to authenticated using (auth.uid() = user_id);
create policy "notif kendi günceller" on public.notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notif admin ekler" on public.notifications
  for insert to authenticated with check (public.is_admin());

grant select, update on public.notifications to authenticated;
grant insert on public.notifications to authenticated;
