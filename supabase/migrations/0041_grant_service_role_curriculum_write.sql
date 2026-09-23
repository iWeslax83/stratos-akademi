-- Geçici: müfredat toplu içe aktarma scripti için service_role'e yazma izni.
-- 0042'de geri alınır.

grant insert, update, delete on public.modules to service_role;
grant insert, update, delete on public.lessons to service_role;
