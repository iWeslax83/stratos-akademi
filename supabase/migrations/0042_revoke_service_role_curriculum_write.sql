-- 0041'de verilen geçici yazma iznini geri alır.

revoke insert, update, delete on public.modules from service_role;
revoke insert, update, delete on public.lessons from service_role;
