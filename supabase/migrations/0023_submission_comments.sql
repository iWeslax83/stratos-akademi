-- Görev gönderimi yorum dizisi (thread): kaptan ↔ üye karşılıklı konuşma.
-- Mevcut tek-seferlik task_submissions.geri_bildirim "son karar notu" olarak kalır;
-- bu tablo süregelen konuşmayı tutar. Yorumlar değiştirilemez/silinemez (update/delete grant yok).

create table if not exists public.submission_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.task_submissions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  mesaj text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_subcomments_sub on public.submission_comments(submission_id, created_at);

alter table public.submission_comments enable row level security;

-- Okuma: kendi gönderimine ait yorumlar ya da admin tüm yorumlar.
create policy "yorum okunur (kendi gönderim veya admin)" on public.submission_comments
  for select to authenticated using (
    public.is_admin() or exists (
      select 1 from public.task_submissions s
      where s.id = submission_id and s.user_id = auth.uid()
    )
  );

-- Ekleme: yazar kendisi olmalı VE (kendi gönderimine ya da admin olarak) yazıyor olmalı.
create policy "yorum ekler (kendi gönderim veya admin)" on public.submission_comments
  for insert to authenticated with check (
    author_id = auth.uid() and (
      public.is_admin() or exists (
        select 1 from public.task_submissions s
        where s.id = submission_id and s.user_id = auth.uid()
      )
    )
  );

-- RLS tek başına yetmez; SQL editörle kurulan tabloya grant ŞART (yoksa 42501).
grant select, insert on public.submission_comments to authenticated;
