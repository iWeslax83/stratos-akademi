-- Kazanılan rozetler (kalıcı + earned_at). Türetilmiş rozetlerin "yeni kazanıldı"
-- tespiti ve ileride kazanma tarihi için. badge_id = lib/badges/catalog.ts id'si.
create table if not exists public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "rozet kendi okunur" on public.user_badges
  for select to authenticated using (auth.uid() = user_id);
create policy "rozet kendi eklenir" on public.user_badges
  for insert to authenticated with check (auth.uid() = user_id);

grant select, insert on public.user_badges to authenticated;
