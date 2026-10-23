-- İsimsiz kalan tek hesap: ibrahimozdemir0332@gmail.com (admin, okul no 558).
-- E-posta, TAKIM.txt ve stratosiha.com üye fotoğrafı (ibrahim-ozdemir.jpg) aynı kişiyi gösteriyor.
-- Tekrar çalıştırmaya dayanıklıdır; yalnız ad boşsa yazar.

update public.allowlist
   set ad = 'İbrahim Özdemir'
 where email = 'ibrahimozdemir0332@gmail.com'
   and coalesce(trim(ad), '') = '';

update public.profiles
   set ad = 'İbrahim Özdemir'
 where email = 'ibrahimozdemir0332@gmail.com'
   and coalesce(trim(ad), '') = '';
