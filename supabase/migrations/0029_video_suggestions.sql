-- Otomatik video önerileri: aday kuyruğu + kalıcı kara liste.

create table if not exists public.video_suggestions (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text unique not null,
  baslik text not null,
  aciklama text,
  kanal text,
  sure_sn int,
  izlenme bigint,
  yayin_tarihi timestamptz,
  onerilen_module_id uuid references public.modules(id) on delete set null,
  uygunluk_skoru int,
  gerekce text,
  durum text not null default 'pending' check (durum in ('pending','approved','rejected')),
  rejected_at timestamptz,
  karar_veren uuid references public.profiles(id) on delete set null,
  karar_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.video_blacklist (
  youtube_video_id text primary key,
  created_at timestamptz not null default now()
);

create index if not exists idx_video_sug_durum_created
  on public.video_suggestions(durum, created_at desc);
create index if not exists idx_video_sug_durum_rejected
  on public.video_suggestions(durum, rejected_at desc);

alter table public.video_suggestions enable row level security;
alter table public.video_blacklist enable row level security;

-- Yalnız admin okur/yazar. (Cron servis anahtarıyla yazar → RLS bypass.)
create policy "video_suggestions admin" on public.video_suggestions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "video_blacklist admin" on public.video_blacklist
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.video_suggestions to authenticated;
grant select, insert, update, delete on public.video_blacklist to authenticated;
