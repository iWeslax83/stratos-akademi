-- Modül başına iki quiz: orta ve zor.
-- Eski kısıt: quizzes.module_id unique (modül başına tek quiz).
-- Yeni kısıt: (module_id, zorluk) unique. Mevcut quizler 'orta' olur.

alter table public.quizzes
  add column if not exists zorluk text not null default 'orta';

alter table public.quizzes drop constraint if exists quizzes_zorluk_check;
alter table public.quizzes
  add constraint quizzes_zorluk_check check (zorluk in ('orta', 'zor'));

alter table public.quizzes drop constraint if exists quizzes_module_id_key;
create unique index if not exists uq_quizzes_module_zorluk
  on public.quizzes (module_id, zorluk);

-- Sütun-düzeyinde grant kullanılmıyor (quizzes tablo-düzeyinde select); yeni kolon
-- authenticated ve service_role için otomatik okunur.
