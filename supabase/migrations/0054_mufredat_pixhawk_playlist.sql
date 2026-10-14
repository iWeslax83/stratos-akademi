-- Pixhawk Uçuş Kartı Kurulumu playlist'i (Drone Hava Sahası, 12 video, Türkçe).
-- Uçuş kontrol ve kalibrasyon videoları Uçuş Kontrol & Kurulum'a, Wi-Fi/Bluetooth
-- telemetri Aktüatör ve Haberleşme'ye, FPV/OSD İHA Elektronik Sistemleri'ne eklenir.
-- Idempotent (on conflict do nothing). Supabase SQL editörde çalıştırın.

begin;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select m.id from public.modules m join public.tracks t on t.id = m.track_id where t.slug = 'ortak-temel' and m.ad = 'Uçuş Kontrol & Kurulum') m,
(values
  ('Pixhawk Uçuş Kartı İnceleme ve Firmware Yükleme ve Kalibrasyonları', 'U9WKzmjVDMU', 972, 1),
  ('Pixhawk Çevre Ekipmanları(güç kartı, m8n gps, rgb usb, telemetri, i2c board)', 'VPeI6mjpZR4', 1323, 2),
  ('Pixhawk kalibrasyonları (pusula kalibrasyonu) ve testleri && İLK UÇUŞ &&', 'gN57quvwwiw', 1239, 3),
  ('Toplanabilir iniş takımı (HML650) montaj - kurulum ve pixhawk ayarları', 'jgdnpCDZRPk', 1008, 4),
  ('MAVLINK RGB Led (Pixhawk & Apm) kurulumu ve ayarları', '9YjeB6Be4A8', 812, 5),
  ('pixhawk autotune uçuşu (pid ayarları) ve tüm parametreler', 'SgE2sHkjkBs', 1028, 6),
  ('Apm & Pixhawk =) VOLT & AMPER Kalibrasyonu', 'UPia6bCN4wM', 425, 7),
  ('Pixhawk 2.4.8 Chibios Güncellemesi Beta Sürümünde', 'jtKLGYdLT4E', 578, 8)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select m.id from public.modules m join public.tracks t on t.id = m.track_id where t.slug = 'aviyonik' and m.ad = 'Aktüatör ve Haberleşme') m,
(values
  ('Pixhawk & Apm uçuş kartına wifi modüle entegrasyonu (TCP Bağlantısı)', 'k2NFJGoWA3s', 720, 1),
  ('Pixhawk Apm uçuş kartına Bluetooth (HC-05) Kurulumu', 'H6qiBPHNrd0', 596, 2)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select m.id from public.modules m join public.tracks t on t.id = m.track_id where t.slug = 'aviyonik' and m.ad = 'İHA Elektronik Sistemleri') m,
(values
  ('MiniOSD genel bakış ve tüm ayarları (MinimOSD Extra) [FPV Sistemi ilk adım]', '9TdZIU6VYRY', 1245, 1),
  ('FPV Sistem Kurulumu (Pixhawk SJ7 MiniOSD Video Tx Video Rx)', '89qBadP0iEU', 795, 2)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

commit;
