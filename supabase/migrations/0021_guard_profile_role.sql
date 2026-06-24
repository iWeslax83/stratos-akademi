-- GÜVENLİK (kritik): profiles "kendi profilini günceller" RLS politikası WITH CHECK
-- içermediğinden, bir üye anon key + kendi oturumuyla REST API'ye doğrudan
--   PATCH /profiles?id=eq.<kendi-id> { "role": "admin" }
-- atıp kendini admin yapabiliyordu (yetki yükseltme). RLS WITH CHECK OLD/NEW
-- kıyaslayamadığı için düzeltme bir BEFORE UPDATE trigger ile yapılır.
--
-- Kural: role kolonu DEĞİŞİYORSA ve çağıran DB rolü 'authenticated' ise (web üyesi/
-- admini), yalnız is_admin() true ise izin ver. service_role ve postgres (SQL editör,
-- seed) bypass eder. Fonksiyon SECURITY INVOKER (DEFINER DEĞİL) — current_user gerçek
-- çağıran rolü yansıtsın diye; is_admin() zaten kendi içinde SECURITY DEFINER.

create or replace function public.guard_profile_role()
returns trigger
language plpgsql
as $func$
begin
  if new.role is distinct from old.role
     and current_user = 'authenticated'
     and not public.is_admin() then
    raise exception 'Yetki (role) değişimi yalnız adminlere açıktır.';
  end if;
  return new;
end;
$func$;

drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role
  before update on public.profiles
  for each row
  execute function public.guard_profile_role();
