-- Etkinlikler / takvim: toplantı, atölye, TEKNOFEST deadline'ları.
-- Okuma herkese açık (authenticated); yazma yalnız admin. author_id default auth.uid()
-- (server action'da getUser yok — quiz_attempts/announcements kalıbı).

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  baslik text not null,
  aciklama text,
  baslangic timestamptz not null,
  yer text,
  author_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_baslangic on public.events(baslangic);

alter table public.events enable row level security;

create policy "etkinlik okunur" on public.events
  for select to authenticated using (true);
create policy "etkinlik admin yazar" on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- RLS tek başına yetmez; SQL editörle kurulan tabloya grant ŞART (yoksa 42501).
grant select, insert, update, delete on public.events to authenticated;
