-- Video tarama koşularının teşhis kaydı: "neden hiç öneri gelmiyor?" sorusunu
-- tahmin etmeden cevaplayabilmek için her koşunun hunisi (diag) saklanır.

create table if not exists public.video_scan_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  taranan int not null default 0,
  aday int not null default 0,
  eklenen int not null default 0,
  budanan int not null default 0,
  hata text,
  diag jsonb not null default '{}'::jsonb
);

create index if not exists idx_video_scan_runs_created
  on public.video_scan_runs(created_at desc);

alter table public.video_scan_runs enable row level security;

-- Yalnız admin okur. Yazan taraf cron/server action → servis anahtarı (RLS bypass).
create policy "video_scan_runs admin okur" on public.video_scan_runs
  for select to authenticated using (public.is_admin());

grant select on public.video_scan_runs to authenticated;
