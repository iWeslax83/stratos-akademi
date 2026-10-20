-- Betaflight derslerinin Aviyonik dalına taşınması (2026-10-20).
-- 0071 Betaflight'ı Pilot dalına taşıyacaktı ama canlıda Pilot dalı yok; dersler
-- Uçuş Kontrol & Kurulum'un sonunda kaldı. Bunun yerine Aviyonik'te "FPV ve Betaflight"
-- modülü açılır. Taşıma lessons.id'yi korur: lesson_progress kayıtları kaybolmaz.
-- Idempotent. Supabase SQL editörde (postgres rolüyle) çalıştırın; service_role grant gerekmez.

begin;

insert into public.modules (track_id, ad, aciklama, sira)
select t.id, 'FPV ve Betaflight', 'FPV drone''lar için Betaflight kurulumu ve ayarları.',
       coalesce((select max(sira) from public.modules where track_id = t.id), 0) + 1
  from public.tracks t
 where t.slug = 'aviyonik'
   and not exists (select 1 from public.modules m where m.track_id = t.id and m.ad = 'FPV ve Betaflight');

-- Hedefte aynı video zaten varsa dokunma
update public.lessons l
   set module_id = fpv.id, sira = v.k
  from (select m.id from public.modules m join public.tracks t on t.id = m.track_id
         where t.slug = 'aviyonik' and m.ad = 'FPV ve Betaflight') fpv,
       (select m.id from public.modules m join public.tracks t on t.id = m.track_id
         where t.slug = 'ortak-temel' and m.ad = 'Uçuş Kontrol & Kurulum') src,
       (values ('kaYSmWefx3A', 1), ('K-Khq7sYVcQ', 2)) as v(vid, k)
 where l.module_id = src.id
   and l.youtube_video_id = v.vid
   and not exists (select 1 from public.lessons x where x.module_id = fpv.id and x.youtube_video_id = v.vid);

commit;
