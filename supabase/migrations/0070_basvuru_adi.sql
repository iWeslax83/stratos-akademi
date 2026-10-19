-- Hesabın görünen adı her zaman stratosiha.com başvurusundaki ad olsun (Google adı değil).
-- 1) allowlist.ad: site /api/allowlist ile başvurudaki adı yollar (düzgün büyük harfle saklanır).
-- 2) handle_new_user: hesap açılırken allowlist.ad, Google adının önüne geçer. Numarayla girişte
--    açılan hesapların adı bugüne dek boş kalıyordu.
-- 3) service_role yalnız ad sütununu güncelleyebilir (allowlist ve profiles).
-- 4) Var olan kabul edilmiş başvuruların adları geriye dönük yazılır (2026-10-19 itibarıyla).
-- 5) Seccad Ali Berk: okul numarası, hesabı olmayan yazım hatalı başvuru e-postasındaydı; hesabın
--    açıldığı (son başvurudaki) e-postaya taşınır.
-- Tekrar çalıştırmaya dayanıklıdır.

alter table public.allowlist add column if not exists ad text;

alter table public.allowlist drop constraint if exists allowlist_ad_length;
alter table public.allowlist
  add constraint allowlist_ad_length check (ad is null or char_length(ad) between 1 and 100);

grant update (ad) on public.allowlist to service_role;
grant update (ad) on public.profiles to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  allowed_role text;
  basvuru_ad text;
begin
  select role, ad into allowed_role, basvuru_ad from public.allowlist where email = new.email;
  if allowed_role is null then
    raise exception 'Bu e-posta izin listesinde değil: %', new.email;
  end if;
  insert into public.profiles (id, email, ad, role, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(basvuru_ad, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    allowed_role,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

with basvuru(email, ad) as (values
  ('ismailefeaslan40@gmail.com', 'İsmail Efe Aslan'),
  ('devranus24@gmail.com', 'Devran Umut Sezgin'),
  ('hamzatospas@gmail.com', 'Emir Hamza Paspal'),
  ('dnzdcl18@gmail.com', 'Deniz Dicle Ekinci'),
  ('beren.yilmaz1637@icloud.com', 'Beren Yılmaz'),
  ('makifkorkmaz16@gmail.com', 'Mehmet Akif Korkmaz'),
  ('erendulger2011@gmail.com', 'Muhammed Eren Dülger'),
  ('ahmettaha094@gmail.com', 'Ahmet Taha Aydın'),
  ('cavdaromer1033@gmail.com', 'Ömer Çavdar'),
  ('emirorselli@gmail.com', 'Emir Örselli'),
  ('salcanhalilumut@gmail.com', 'Halil Umut Salcan'),
  ('devransafa@gmail.com', 'Safa Devran Yüzden'),
  ('gurbuzzeynephafsa@gmail.com', 'Zeynep Hafsa Gürbüz'),
  ('omerozby2012@gmail.com', 'Ömer Özbay'),
  ('alimurataksu1903@gmail.com', 'Ali Murat Aksu'),
  ('alpmeteyildiz@gmail.com', 'Alp Mete Yıldız'),
  ('atunakindira@gmail.com', 'Ahmet Tuna Kındıra'),
  ('ucarmerve2012@gmail.com', 'Merve Uçar'),
  ('yunuserisenemre1354@gmail.com', 'Yunus Emre Erişen'),
  ('mertbakmax@gmail.com', 'Mert Abdulbaki Bakmaz'),
  ('gokce140212g@gmail.com', 'Gökçe Havva Özçelik'),
  ('leylisucetin@icloud.com', 'Leylisu Çetin'),
  ('cansever05yagmur@gmail.com', 'Yağmur Cansever'),
  ('zeynepinciipek8@gmail.com', 'Zeynep İnci İpek'),
  ('aksoyyusuf1613@gmail.com', 'Yusuf Aksoy'),
  ('okilicarslan86@gmail.com', 'Oğuz Kılıçarslan'),
  ('seyhansarier01@hotmail.com', 'Aras Sarıer'),
  ('seccadaberk12@gmail.com', 'Seccad Ali Berk'),
  ('fatihozel1202@gmail.com', 'Fatih Özel'),
  ('emirarcan95@gmail.com', 'Emir Arcan'),
  ('muhammedyasinyuzak@gmail.com', 'İbrahim Yüzak'),
  ('mali.camur51@gmail.com', 'Muhammet Ali Çamur'),
  ('yusufselmantaskulak@gmail.com', 'Yusuf Selman Taşkulak'),
  ('muhammedduranzorlu@gmail.com', 'Muhammed Duran Zorlu'),
  ('bakkalbasideniz@gmail.com', 'Deniz Atay Bakkalbaşı'),
  ('mfurkanbadem12@gmail.com', 'Mehmet Furkan Badem'),
  ('taran.durutaran@gmail.com', 'Duru Taran'),
  ('seccadaliberk12@gmail.com', 'Seccad Ali Berk'),
  ('yildirimatabey7@gmail.com', 'Atabey Yıldırım'),
  ('inci016nur@gmail.com', 'İncinur Koçdemir'),
  ('serraoz2012@gmail.com', 'Serra Öz'),
  ('isikzuleyha86@gmail.com', 'Muhammet Yusuf Işık'),
  ('muhammedyusufdogan2012@gmail.com', 'Muhammed Yusuf Doğan'),
  ('hasanasafsimsek@gmail.com', 'Hasan Asaf Şimşek'),
  ('dorukkygsz@gmail.com', 'Doruk Kaygısız'),
  ('efesntrk6167@gmail.com', 'Efe Şentürk'),
  ('yigiterdol61@gmail.com', 'Yiğit Erdöl'),
  ('16meric16nesipogullari@gmail.com', 'Meriç Nesipoğulları'),
  ('kagan_degirmencioglu@gmail.com', 'Kağan Değirmencioğlu'),
  ('omererdemyilmaz0616@gmail.com', 'Ömer Erdem Yılmaz'),
  ('berk.duztepe@icloud.com', 'İbrahim Berk Düztepe'),
  ('akhanim2116@gmail.com', 'Muhammed Emir Ablak'),
  ('sertugyildirim123@gmail.com', 'Sertuğ Yıldırım'),
  ('ibrahimefearkin@gmail.com', 'İbrahim Efe Arkın'),
  ('ertugrulkadirinay@gmail.com', 'Ertuğrul Kadir İnay'),
  ('erenkosedag16@gmail.com', 'Eren Kösedağ'),
  ('salihsalih1226@gmail.com', 'Salih Sayraç'),
  ('iekremaral@gmail.com', 'Ekrem Aral Irmak'),
  ('erenbuyukeren42@gmail.com', 'Eren Büyükeren'),
  ('haticeukun@yahoo.com', 'Hatice Uçkun'),
  ('erenxon@gmail.com', 'Mehmet Eren Uyar'),
  ('ofidan768@gmail.com', 'Ömer Fidan'),
  ('eymenok10@gmail.com', 'Ramazan Eymen Ok'),
  ('samidoganay765@gmail.com', 'Sami Doğanay')
), al as (
  update public.allowlist a set ad = b.ad from basvuru b where a.email = b.email
)
update public.profiles p set ad = b.ad from basvuru b where p.email = b.email;

-- Seccad Ali Berk: seccadaberk12 ile hiç hesap açılmadı (başvuru 31, yazım hatası),
-- hesap seccadaliberk12'de (başvuru 41). Numara yalnız hesapsız satırdaysa taşınır.
delete from public.allowlist a
where a.email = 'seccadaberk12@gmail.com'
  and a.role = 'uye'
  and not exists (select 1 from public.profiles p where p.email = a.email);
update public.allowlist set student_no = '755'
where email = 'seccadaliberk12@gmail.com'
  and student_no is null
  and not exists (select 1 from public.allowlist where student_no = '755');
