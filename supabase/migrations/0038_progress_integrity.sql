-- 0038: İlerleme ve yetkinlik bütünlüğü (0022 quiz puanlamasının aynısı, ders/dal için).
--
-- SORUN: lesson_progress ve user_competencies'e authenticated INSERT/UPDATE + yalnız
-- user_id = auth.uid() kontrol eden RLS verildiğinden, üye anon key + kendi oturumuyla
-- REST'e doğrudan
--   POST /rest/v1/lesson_progress   { "lesson_id": "...", "completed": true }
--   POST /rest/v1/user_competencies { "track_slug": "aviyonik" }
-- atıp hiç video izlemeden dersleri "tamamlandı", dalları "kazanıldı" yapıp liderlik
-- puanını (leaderboard() ders başına +20 sayar) ve sertifikaları (earnedCompetencies
-- lesson_progress'ten türetir) şişirebiliyordu. Yazma yalnız sunucuya (service_role,
-- markLessonComplete/syncCompetencies içinde doğrulayarak) bırakılır.

-- lesson_progress: üyenin doğrudan yazma yolunu kapat. SELECT ("ilerleme kendi okunur") durur.
revoke insert, update on public.lesson_progress from authenticated;
drop policy if exists "ilerleme kendi eklenir" on public.lesson_progress;
drop policy if exists "ilerleme kendi güncellenir" on public.lesson_progress;
grant insert, update on public.lesson_progress to service_role;

-- user_competencies: üyenin doğrudan yazma yolunu kapat. SELECT ("yetkinlik kendi okunur") durur.
revoke insert on public.user_competencies from authenticated;
drop policy if exists "yetkinlik kendi eklenir" on public.user_competencies;
grant insert on public.user_competencies to service_role;

-- Not: markLessonComplete süreyi, syncCompetencies müfredat/mevcut-yetkinlik bilgisini
-- ÇAĞIRANIN kendi client'ıyla okur (RLS izin verir) — bu tablolara service_role SELECT
-- grant'i gerekmez. service_role yalnız yazma için kullanılır. member_profile() RPC
-- user_competencies'i SECURITY DEFINER ile okur, o yol da grant'tan etkilenmez.
