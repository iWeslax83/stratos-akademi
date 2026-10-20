-- Uçuş Kontrol & Kurulum sıralaması + Betaflight'ın Pilot dalına taşınması (2026-10-19).
-- Sorun: 0049 eski PixHawk/QGC derslerini silince Betaflight modülün ilk dersi oldu;
-- üye Drone Temelleri'nden doğrudan Betaflight arayüzüne düşüyordu.
-- 1) Modül önce kavram (kart, sensörler), sonra araç (arayüz, Pixhawk kurulum), sonra uçuş olarak sıralanır.
-- 2) Betaflight (FPV yazılımı) Pilot dalında yeni "FPV ve Betaflight" modülüne taşınır.
--    Taşıma lessons.id'yi korur: lesson_progress kayıtları kaybolmaz.
-- 3) Uçuş Kontrol zor quizindeki Betaflight'a bağlı soru metni genelleştirilir.
-- Idempotent. Supabase SQL editörde (postgres rolüyle) çalıştırın; service_role grant gerekmez.

begin;

-- 1) Pilot dalında FPV modülü
insert into public.modules (track_id, ad, aciklama, sira)
select t.id, 'FPV ve Betaflight', 'FPV drone''lar için Betaflight kurulumu ve ayarları.',
       coalesce((select max(sira) from public.modules where track_id = t.id), 0) + 1
  from public.tracks t
 where t.slug = 'pilot'
   and not exists (select 1 from public.modules m where m.track_id = t.id and m.ad = 'FPV ve Betaflight');

update public.tracks set aciklama = 'Uçuş ve görev, FPV'
 where slug = 'pilot' and aciklama = 'Uçuş ve görev (yakında)';

-- 2) Betaflight derslerini taşı (hedefte aynı video zaten varsa dokunma)
update public.lessons l
   set module_id = fpv.id, sira = v.k
  from (select m.id from public.modules m join public.tracks t on t.id = m.track_id
         where t.slug = 'pilot' and m.ad = 'FPV ve Betaflight') fpv,
       (select m.id from public.modules m join public.tracks t on t.id = m.track_id
         where t.slug = 'ortak-temel' and m.ad = 'Uçuş Kontrol & Kurulum') src,
       (values ('kaYSmWefx3A', 1), ('K-Khq7sYVcQ', 2)) as v(vid, k)
 where l.module_id = src.id
   and l.youtube_video_id = v.vid
   and not exists (select 1 from public.lessons x where x.module_id = fpv.id and x.youtube_video_id = v.vid);

-- 3) Uçuş Kontrol & Kurulum yeni sırası. Listede olmayan dersler (admin eklemiş olabilir)
--    göreli sıraları korunarak sona gider.
update public.lessons l
   set sira = 100 + l.sira
  from public.modules m join public.tracks t on t.id = m.track_id
 where l.module_id = m.id and t.slug = 'ortak-temel' and m.ad = 'Uçuş Kontrol & Kurulum'
   and l.sira < 100
   and l.youtube_video_id not in ('ojglF4fv1PQ','ngCIrmQpHE0','9mSaH1nVdVc','8f-im0KARBg','U9WKzmjVDMU',
     'VPeI6mjpZR4','UPia6bCN4wM','gN57quvwwiw','PEz0mP5WJPM','SgE2sHkjkBs','jgdnpCDZRPk','9YjeB6Be4A8','jtKLGYdLT4E');

update public.lessons l
   set sira = v.k
  from public.modules m join public.tracks t on t.id = m.track_id,
       (values
         ('ojglF4fv1PQ', 1),   -- Uçuş Kontrol Kartı
         ('ngCIrmQpHE0', 2),   -- Sensörler ve Otopilot
         ('9mSaH1nVdVc', 3),   -- Sensörler ve Kestiriciler
         ('8f-im0KARBg', 4),   -- İHA Yazılım Arayüz Ayarları
         ('U9WKzmjVDMU', 5),   -- Pixhawk inceleme, firmware, kalibrasyon
         ('VPeI6mjpZR4', 6),   -- Pixhawk çevre ekipmanları
         ('UPia6bCN4wM', 7),   -- Volt ve amper kalibrasyonu
         ('gN57quvwwiw', 8),   -- Pusula kalibrasyonu ve ilk uçuş
         ('PEz0mP5WJPM', 9),   -- İHA Test Uçuşu
         ('SgE2sHkjkBs', 10),  -- Autotune (PID)
         ('jgdnpCDZRPk', 11),  -- Toplanabilir iniş takımı
         ('9YjeB6Be4A8', 12),  -- MAVLink RGB LED
         ('jtKLGYdLT4E', 13)   -- ChibiOS güncellemesi
       ) as v(vid, k)
 where l.module_id = m.id and t.slug = 'ortak-temel' and m.ad = 'Uçuş Kontrol & Kurulum'
   and l.youtube_video_id = v.vid;

-- 4) Betaflight artık bu modülde anlatılmıyor: güvenlik sorusunu araçtan bağımsız yap
update public.questions q
   set metin = 'İlk kurulumda motor yönlerini yer istasyonu yazılımından (ör. Mission Planner) test ederken hangi güvenlik kuralı geçerlidir?'
  from public.quizzes z, public.modules m
 where q.quiz_id = z.id and z.module_id = m.id and m.ad = 'Uçuş Kontrol & Kurulum' and z.zorluk = 'zor'
   and q.metin = 'İlk kurulumda motor yönlerini Betaflight''ta test ederken hangi güvenlik kuralı geçerlidir?';

commit;
