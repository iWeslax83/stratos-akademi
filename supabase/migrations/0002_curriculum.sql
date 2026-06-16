-- Dallar (track), Modüller, Dersler, ve kullanıcı ilerlemesi

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  ad text not null,
  aciklama text,
  ikon text,
  sira int not null default 0
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  ad text not null,
  aciklama text,
  sira int not null default 0
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  baslik text not null,
  youtube_video_id text not null,
  aciklama text,
  sure_sn int,
  sira int not null default 0
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists idx_modules_track on public.modules(track_id, sira);
create index if not exists idx_lessons_module on public.lessons(module_id, sira);
create index if not exists idx_progress_user on public.lesson_progress(user_id);

alter table public.tracks enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;

create policy "tracks okunur" on public.tracks for select using (auth.role() = 'authenticated');
create policy "modules okunur" on public.modules for select using (auth.role() = 'authenticated');
create policy "lessons okunur" on public.lessons for select using (auth.role() = 'authenticated');

create policy "ilerleme kendi okunur" on public.lesson_progress for select using (auth.uid() = user_id);
create policy "ilerleme kendi eklenir" on public.lesson_progress for insert with check (auth.uid() = user_id);
create policy "ilerleme kendi güncellenir" on public.lesson_progress for update using (auth.uid() = user_id);

grant select on public.tracks to authenticated;
grant select on public.modules to authenticated;
grant select on public.lessons to authenticated;
grant select, insert, update on public.lesson_progress to authenticated;
