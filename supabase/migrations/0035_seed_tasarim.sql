-- Tasarım dalı müfredatı: SolidWorks + 3D baskı ("ÇİZİM" playlist'i)
-- Dal şimdiye dek boştu; artık içerik geldiği için "(yakında)" ibaresi kalkıyor.

update public.tracks
set aciklama = 'CAD, 3D baskı ve üretim'
where slug = 'tasarim';

-- Yalnız Tasarım dalı modülsüzken çalışır; tekrar çalıştırılırsa hiçbir şey eklemez.
with t as (
  select tr.id from public.tracks tr
  where tr.slug = 'tasarim'
    and not exists (select 1 from public.modules m where m.track_id = tr.id)
),
m1 as (
  insert into public.modules (track_id, ad, aciklama, sira)
  select id, 'CAD Temelleri (SolidWorks)', 'Sketch, katı modelleme, parça ve montaj', 1 from t
  returning id
),
m2 as (
  insert into public.modules (track_id, ad, aciklama, sira)
  select id, 'SolidWorks Alıştırmaları', 'Modelleme pratiği — kolaydan zora', 2 from t
  returning id
),
m3 as (
  insert into public.modules (track_id, ad, aciklama, sira)
  select id, '3D Baskı ve Üretim', 'Tasarladığını bastırmak: yazıcı ve dilimleyici', 3 from t
  returning id
)
insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select id, 'SolidWorks Essential Training — Parça ve Montaj', '37BdvE2YNVY', 15450, 1 from m1
union all select id, 'Yeni Başlayanlar için Sketch Alıştırması', '9bH4UpLTq0s', 1134, 2 from m1
union all select id, 'Alıştırma 57', 'XqiBNbt0jVc', 655, 1 from m2
union all select id, 'Alıştırma 60', 'sOUHYyNXSZQ', 633, 2 from m2
union all select id, 'Alıştırma 92', 'pyX8ttTLhlk', 814, 3 from m2
union all select id, 'Alıştırma 101', 'ywfUsgqNg2Y', 1447, 4 from m2
union all select id, 'Loft Alıştırması', 'JoiiopkE2X4', 457, 5 from m2
union all select id, 'Doğrusal ve Dairesel Pattern', 'ogsBu7TcfDI', 1107, 6 from m2
union all select id, 'Yeni Başlayanlar için 3D Baskı Rehberi', 'B84CgaPdixc', 888, 1 from m3
union all select id, '3D Yazıcı Dilimleyicilerine Giriş', 'yXNZ_2-rHNE', 1252, 2 from m3;
