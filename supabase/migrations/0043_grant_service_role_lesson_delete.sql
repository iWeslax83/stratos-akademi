-- Geçici: eğitim değeri olmayan tek bir dersi silmek için service_role'e yazma izni.
-- 0044'te geri alınır.

grant delete on public.lessons to service_role;
