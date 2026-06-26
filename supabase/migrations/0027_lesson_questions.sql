-- Ders altı soru-cevap: üyeler ders sayfasında soru sorar, kaptan/akran yanıtlar.
-- Ders başına PAYLAŞILAN thread (kulüp bilgi tabanı) — herkes okur. Yazma: kendi adına
-- her üye. Silme: yazan ya da admin (moderasyon). Düzenleme yok (immutable).

create table if not exists public.lesson_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  mesaj text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_lq_lesson on public.lesson_questions(lesson_id, created_at);

alter table public.lesson_questions enable row level security;

create policy "soru okunur" on public.lesson_questions
  for select to authenticated using (true);
create policy "soru ekler (kendi adına)" on public.lesson_questions
  for insert to authenticated with check (author_id = auth.uid());
create policy "soru siler (yazan ya da admin)" on public.lesson_questions
  for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- RLS tek başına yetmez; SQL editörle kurulan tabloya grant ŞART (yoksa 42501).
grant select, insert, delete on public.lesson_questions to authenticated;
