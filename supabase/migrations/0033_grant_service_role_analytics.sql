-- Aynı service_role grant tuzağının iki kurbanı daha (bkz. 0031):
--
-- 1) /admin/analitik ilerleme/quiz/görev verilerini service_role ile okuyor. Grant olmadığı
--    için "permission denied" alıp BOŞ dizi dönüyordu — sayfa hata vermeden herkesin
--    ilerlemesini SIFIR gösteriyordu (tamamlama oranları, riskli üyeler, son aktivite: hepsi yanlış).
--
-- 2) removeMember() üyeyi auth'tan silip allowlist kaydını da temizliyor; allowlist grant'i
--    olmadığı için silme sessizce başarısız oluyor, e-posta davetli listesinde kalıyordu
--    (silinen üye tekrar giriş yapabilirdi).
--
-- Yalnız okunan/gereken izinler verilir; service_role zaten RLS'i bypass eder.

grant select on public.lesson_progress to service_role;
grant select on public.quiz_attempts to service_role;
grant select on public.task_submissions to service_role;
grant select, delete on public.allowlist to service_role;
