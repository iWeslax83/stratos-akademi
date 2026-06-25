-- Duyurular: kaptanlar üyelere toplu duyuru yapar (toplantı, deadline, yeni içerik).
-- Okuma herkese açık (authenticated); yazma yalnız admin. author_id default auth.uid()
-- ile dolar (server action'da getUser çağrılmaz — quiz_attempts kalıbı).

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  baslik text not null,
  icerik text not null,
  author_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_announcements_created on public.announcements(created_at desc);

alter table public.announcements enable row level security;

create policy "duyuru okunur" on public.announcements
  for select to authenticated using (true);
create policy "duyuru admin yazar" on public.announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- RLS tek başına yetmez; SQL editörle kurulan tabloya grant ŞART (yoksa 42501).
grant select, insert, update, delete on public.announcements to authenticated;
