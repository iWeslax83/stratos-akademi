-- 0031 notifications'a yalnız INSERT verdi; sunucu tarafı akışları (ve doğrulama sorguları)
-- okumak da isteyebiliyor. Okuma yetkisi olmadan "bildirim gitti mi?" sorusu cevaplanamıyor.
grant select on public.notifications to service_role;
