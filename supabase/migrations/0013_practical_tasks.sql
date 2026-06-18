create table if not exists public.practical_tasks (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  baslik text not null,
  aciklama text,
  sira int not null default 0
);

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.practical_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  icerik text not null,
  durum text not null default 'beklemede' check (durum in ('beklemede','onay','red')),
  geri_bildirim text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, task_id)
);

create index if not exists idx_tasks_module on public.practical_tasks(module_id, sira);
create index if not exists idx_subs_task on public.task_submissions(task_id);
create index if not exists idx_subs_durum on public.task_submissions(durum);

alter table public.practical_tasks enable row level security;
alter table public.task_submissions enable row level security;

-- practical_tasks: herkes okur; admin yazar.
create policy "tasks okunur" on public.practical_tasks
  for select to authenticated using (true);
create policy "tasks admin yazar" on public.practical_tasks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- task_submissions
create policy "sub okunur (kendi veya admin)" on public.task_submissions
  for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "sub üye ekler" on public.task_submissions
  for insert to authenticated with check (auth.uid() = user_id and durum = 'beklemede');
create policy "sub üye günceller" on public.task_submissions
  for update to authenticated
  using (auth.uid() = user_id and durum <> 'onay')
  with check (auth.uid() = user_id and durum = 'beklemede');
create policy "sub admin günceller" on public.task_submissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.practical_tasks to authenticated;
grant select, insert, update on public.task_submissions to authenticated;
