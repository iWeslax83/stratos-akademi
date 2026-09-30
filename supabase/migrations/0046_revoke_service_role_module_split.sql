-- 0045'te verilen geçici izni geri alır.

revoke insert, update, delete on public.modules from service_role;
revoke insert, update, delete on public.lessons from service_role;
