-- Geçici: CAD Temelleri: Ana Tasarım modülünü alt modüllere bölmek için service_role'e yazma izni.
-- 0046'da geri alınır.

grant insert, update, delete on public.modules to service_role;
grant insert, update, delete on public.lessons to service_role;
