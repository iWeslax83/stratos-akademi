-- Kazanılan dal yetkinlikleri (kalıcı + earned_at). badge_key yerine track_slug.
create table if not exists public.user_competencies (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_slug text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, track_slug)
);

alter table public.user_competencies enable row level security;

create policy "yetkinlik kendi okunur" on public.user_competencies
  for select to authenticated using (auth.uid() = user_id);
create policy "yetkinlik kendi eklenir" on public.user_competencies
  for insert to authenticated with check (auth.uid() = user_id);

grant select, insert on public.user_competencies to authenticated;
