-- GÜVENLİK: quiz_attempts.puan üye tarafından kontrol edilebiliyordu. authenticated'a
-- tüm-kolon INSERT grant'i + RLS insert (yalnız user_id kontrolü) verildiğinden, üye
-- anon key + kendi oturumuyla REST'e doğrudan
--   POST /quiz_attempts { "quiz_id": "...", "puan": 100, "gecti": true }
-- atıp puanlamayı atlayarak liderlik puanını şişirebiliyordu. Puanlama yalnız sunucuda
-- (service_role, doğru cevapları okuyarak) yapılmalı; üyenin doğrudan ekleme yolu kapatılır.

-- Üyenin doğrudan attempt eklemesini kaldır.
revoke insert on public.quiz_attempts from authenticated;
drop policy if exists "attempt kendi eklenir" on public.quiz_attempts;

-- submitQuiz artık attempt'i service_role ile ekler (RLS'i bypass eder; grant yine de şart).
grant insert on public.quiz_attempts to service_role;

-- Oturumdaki kullanıcının id'sini getUser() (refresh-token rotasyonu, action'da yasak)
-- OLMADAN almak için. Authenticated client bunu çağırır; JWT'den auth.uid() döner.
create or replace function public.my_uid()
returns uuid
language sql
stable
as $func$ select auth.uid() $func$;

revoke execute on function public.my_uid() from public;
grant execute on function public.my_uid() to authenticated;
