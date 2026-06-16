-- Curated başlangıç müfredatı. Yalnız boş veritabanında bir kez çalıştırın.

insert into public.tracks (slug, ad, aciklama, ikon, sira) values
  ('ortak-temel', 'Ortak Temel', 'Herkesin başladığı drone temelleri', '🚀', 1),
  ('elektronik', 'Elektronik', 'Temel elektronik, lehimleme ve PCB', '⚡', 2),
  ('yazilim', 'Yazılım', 'Web ve uygulama geliştirme', '💻', 3),
  ('tasarim', 'Tasarım', 'CAD ve aerodinamik (yakında)', '✏️', 4),
  ('pilot', 'Pilot', 'Uçuş ve görev (yakında)', '🎮', 5);

with t as (select id from public.tracks where slug = 'ortak-temel'),
     m1 as (insert into public.modules (track_id, ad, sira) select id, 'Drone Temelleri', 1 from t returning id),
     m2 as (insert into public.modules (track_id, ad, sira) select id, 'Uçuş Kontrol & Kurulum', 2 from t returning id)
insert into public.lessons (module_id, baslik, youtube_video_id, sira)
select id, 'Drone Nasıl Çalışır?', 'N_XneaFmOmU', 1 from m1
union all select id, 'Drone Teorisi 101 — Bölüm 1', 'K05UwsiqZ_E', 2 from m1
union all select id, 'DIY Drone Parçaları', 'h6q6tfqX3kA', 3 from m1
union all select id, 'PixHawk Kurulum & Kalibrasyon (1/5)', 'uH2iCRA9G7k', 1 from m2
union all select id, 'PixHawk Güç & İlk Uçuş (2/5)', 'CfQ-9MIHKkU', 2 from m2
union all select id, 'QGroundControl ile Uçuşa Giriş', 'z0a_rQZTbBg', 3 from m2
union all select id, 'Betaflight Detaylı Türkçe — Bölüm 1', 'kaYSmWefx3A', 4 from m2
union all select id, 'Betaflight Detaylı Türkçe — Bölüm 2', 'K-Khq7sYVcQ', 5 from m2;

with t as (select id from public.tracks where slug = 'elektronik'),
     m1 as (insert into public.modules (track_id, ad, sira) select id, 'Temel Elektronik', 1 from t returning id),
     m2 as (insert into public.modules (track_id, ad, sira) select id, 'Lehimleme', 2 from t returning id),
     m3 as (insert into public.modules (track_id, ad, sira) select id, 'PCB Tasarımı (KiCad)', 3 from t returning id)
insert into public.lessons (module_id, baslik, youtube_video_id, sira)
select id, '20 Dakikada Temel Elektronik', 'SoH3zCsASz8', 1 from m1
union all select id, 'Gerilim, Akım ve Direnç Nedir?', '_EMXLNe78xI', 2 from m1
union all select id, 'AC ve DC Nedir?', 'p00fpCollrk', 3 from m1
union all select id, 'Multimetre Nasıl Kullanılır?', '2FoECRTlxZg', 4 from m1
union all select id, 'Lehimlemeye Başlangıç Rehberi', '3jAw41LRBxU', 1 from m2
union all select id, 'Lehimlemede 10 Hata ve İpuçları', 'Fp37DPZVdRI', 2 from m2
union all select id, 'KiCad 1 — Giriş ve Kurulum', 'SsDTp9-GYYE', 1 from m3
union all select id, 'KiCad 2 — İş Akışı', 'exqsBBMrNF4', 2 from m3
union all select id, 'KiCad 3 — Şematik Oluşturma', 'rSYIbXPIGA4', 3 from m3
union all select id, 'KiCad 4 — Şematikten PCB''ye', 'aK56TuX-qW8', 4 from m3
union all select id, 'KiCad 5 — PCBnew', '9ySjwEOVa1Q', 5 from m3
union all select id, 'KiCad 6 — Gerber Çıktısı', 'UH3CRAJ5YFk', 6 from m3;

with t as (select id from public.tracks where slug = 'yazilim'),
     m1 as (insert into public.modules (track_id, ad, sira) select id, 'Web Temelleri', 1 from t returning id),
     m2 as (insert into public.modules (track_id, ad, sira) select id, 'Modern Web', 2 from t returning id)
insert into public.lessons (module_id, baslik, youtube_video_id, sira)
select id, 'HTML — Başlangıç Crash Course', '916GWv2Qs08', 1 from m1
union all select id, 'CSS — Tam Kurs', 'OXGznpKZ_sA', 2 from m1
union all select id, 'JavaScript — Tam Kurs', 'jS4aFq5-91M', 3 from m1
union all select id, 'React 18 + Redux Toolkit', '2-crBg6wpp0', 1 from m2
union all select id, 'Next.js — Tam Yığın Uygulama', 'KjY94sAKLlw', 2 from m2;
