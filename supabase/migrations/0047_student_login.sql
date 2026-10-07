-- Öğrenci numarası ile giriş (bkz. docs/superpowers/specs/2026-10-07-ogrenci-no-giris-design.md).
-- Numara siteden /api/allowlist ile gelir, elle girilmez. Tekrar çalıştırmaya dayanıklıdır.

alter table public.allowlist add column if not exists student_no text;

alter table public.allowlist drop constraint if exists allowlist_student_no_format;
alter table public.allowlist
  add constraint allowlist_student_no_format
  check (student_no is null or student_no ~ '^[0-9]{1,10}$');

-- Aynı numara iki e-postaya bağlanamaz. Dizin adı uygulamada çakışmayı ayırt etmek için kullanılır.
create unique index if not exists allowlist_student_no_key
  on public.allowlist (student_no)
  where student_no is not null;

-- service_role yalnız student_no sütununu güncelleyebilir: /api/allowlist token'ı sızsa bile
-- rol alanı (admin yükseltme) değiştirilemez.
grant update (student_no) on public.allowlist to service_role;

-- Rate limit: sunucusuz örnekler arası tutarlı olsun diye bellekte değil tabloda.
-- RLS açık ve politika yok: yalnız service_role (RLS'i bypass eder) erişir.
create table if not exists public.student_login_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  student_no text not null,
  created_at timestamptz not null default now()
);

create index if not exists student_login_attempts_ip_idx
  on public.student_login_attempts (ip, created_at);
create index if not exists student_login_attempts_no_idx
  on public.student_login_attempts (student_no, created_at);

alter table public.student_login_attempts enable row level security;

grant select, insert, delete on public.student_login_attempts to service_role;
