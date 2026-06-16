create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null unique references public.modules(id) on delete cascade,
  baslik text not null,
  gecme_esigi int not null default 70,
  sira int not null default 0
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  metin text not null,
  sira int not null default 0
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  metin text not null,
  dogru boolean not null default false,
  sira int not null default 0
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  puan int not null,
  gecti boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_questions_quiz on public.questions(quiz_id, sira);
create index if not exists idx_options_question on public.question_options(question_id, sira);
create index if not exists idx_attempts_user_quiz on public.quiz_attempts(user_id, quiz_id);

alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.quiz_attempts enable row level security;

create policy "quizzes okunur" on public.quizzes for select using (auth.role() = 'authenticated');
create policy "questions okunur" on public.questions for select using (auth.role() = 'authenticated');
create policy "options okunur" on public.question_options for select using (auth.role() = 'authenticated');
create policy "attempt kendi okunur" on public.quiz_attempts for select using (auth.uid() = user_id);
create policy "attempt kendi eklenir" on public.quiz_attempts for insert with check (auth.uid() = user_id);

grant select on public.quizzes to authenticated;
grant select on public.questions to authenticated;
-- DİKKAT: dogru sütunu HARİÇ (cevaplar istemciye gönderilmez).
grant select (id, question_id, metin, sira) on public.question_options to authenticated;
grant select, insert on public.quiz_attempts to authenticated;
