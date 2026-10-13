-- Müfredat yeniden düzeni (2026-10-13).
-- 1) Çalışmayan/İngilizce dersleri sil, boşalan Modern Web modülünü kaldır.
-- 2) 5 yeni playlist'ten (T3Akademi, Emrehan İnci, TÜBİTAK UAV, Evde Elektronik, Atıl Samancıoğlu Cursor) uygun dersleri ekle.
-- Idempotent: tekrar çalıştırmak güvenli (silme video_id ile, ekleme on conflict do nothing).
-- Supabase SQL editörde (postgres rolüyle) çalıştırın; service_role grant gerekmez.
-- DİKKAT: silinen derslerin lesson_progress kayıtları cascade ile gider.

begin;

delete from public.lessons where youtube_video_id in (
'3jAw41LRBxU',
'Fp37DPZVdRI',
'jiJGbWOSdMo',
'd9_-lQq8ShE',
'3FGNw28xBr0',
'b-7bMl6fJio',
'916GWv2Qs08',
'OXGznpKZ_sA',
'jS4aFq5-91M',
'2-crBg6wpp0',
'KjY94sAKLlw',
'xYoTbKJGSLE',
'l1cWUrG_vNs',
'K6cXqv_yMCs',
'uH2iCRA9G7k',
'CfQ-9MIHKkU',
'z0a_rQZTbBg',
'N_XneaFmOmU',
'K05UwsiqZ_E',
'p00fpCollrk'
);

delete from public.modules m
 where m.ad = 'Modern Web'
   and not exists (select 1 from public.lessons l where l.module_id = m.id);

-- Yeni modüller
insert into public.modules (track_id, ad, aciklama, sira)
select (select id from public.tracks where slug = 'ortak-temel'), 'Aerodinamik ve Uçuş Mekaniği', 'Kuvvetler, kanat profili, taşıma ve sürükleme, stabilite ve uçuş performansı.', coalesce((select max(sira) from public.modules where track_id = (select id from public.tracks where slug = 'ortak-temel')), 0) + 1
where not exists (select 1 from public.modules where track_id = (select id from public.tracks where slug = 'ortak-temel') and ad = 'Aerodinamik ve Uçuş Mekaniği');

insert into public.modules (track_id, ad, aciklama, sira)
select (select id from public.tracks where slug = 'ortak-temel'), 'Sabit Kanat Tasarımı', 'Sabit kanatlı İHA bileşenleri, gövde, kanat, kuyruk ve kontrol yüzeyleri.', coalesce((select max(sira) from public.modules where track_id = (select id from public.tracks where slug = 'ortak-temel')), 0) + 1
where not exists (select 1 from public.modules where track_id = (select id from public.tracks where slug = 'ortak-temel') and ad = 'Sabit Kanat Tasarımı');

insert into public.modules (track_id, ad, aciklama, sira)
select (select id from public.tracks where slug = 'ortak-temel'), 'İHA Tasarım Süreci', 'Yol haritasından kavramsal tasarıma, sistem mimarisi ve bileşen seçimi.', coalesce((select max(sira) from public.modules where track_id = (select id from public.tracks where slug = 'ortak-temel')), 0) + 1
where not exists (select 1 from public.modules where track_id = (select id from public.tracks where slug = 'ortak-temel') and ad = 'İHA Tasarım Süreci');

insert into public.modules (track_id, ad, aciklama, sira)
select (select id from public.tracks where slug = 'aviyonik'), 'Devre Elemanları', 'Diyot, transistör, LED, kapasitör, röle, regülatör, sigorta ve PWM.', coalesce((select max(sira) from public.modules where track_id = (select id from public.tracks where slug = 'aviyonik')), 0) + 1
where not exists (select 1 from public.modules where track_id = (select id from public.tracks where slug = 'aviyonik') and ad = 'Devre Elemanları');

insert into public.modules (track_id, ad, aciklama, sira)
select (select id from public.tracks where slug = 'aviyonik'), 'Aktüatör ve Haberleşme', 'Servo, step motor, uzaktan kumanda ve Bluetooth modülleri.', coalesce((select max(sira) from public.modules where track_id = (select id from public.tracks where slug = 'aviyonik')), 0) + 1
where not exists (select 1 from public.modules where track_id = (select id from public.tracks where slug = 'aviyonik') and ad = 'Aktüatör ve Haberleşme');

insert into public.modules (track_id, ad, aciklama, sira)
select (select id from public.tracks where slug = 'aviyonik'), 'İHA Elektronik Sistemleri', 'Motor, batarya, uçuş kontrol kartı ve GNSS, itki sistemleri, radyo kontrol.', coalesce((select max(sira) from public.modules where track_id = (select id from public.tracks where slug = 'aviyonik')), 0) + 1
where not exists (select 1 from public.modules where track_id = (select id from public.tracks where slug = 'aviyonik') and ad = 'İHA Elektronik Sistemleri');

insert into public.modules (track_id, ad, aciklama, sira)
select (select id from public.tracks where slug = 'yazilim'), 'Drone Programlama', 'DroneKit ve ArduPilot SITL ile Python''dan drone kontrolü.', coalesce((select max(sira) from public.modules where track_id = (select id from public.tracks where slug = 'yazilim')), 0) + 1
where not exists (select 1 from public.modules where track_id = (select id from public.tracks where slug = 'yazilim') and ad = 'Drone Programlama');

insert into public.modules (track_id, ad, aciklama, sira)
select (select id from public.tracks where slug = 'yazilim'), 'Yapay Zeka ile Yazılım Geliştirme', 'Cursor ile backend, frontend, veritabanı, sunucu ve Android uygulama geliştirme.', coalesce((select max(sira) from public.modules where track_id = (select id from public.tracks where slug = 'yazilim')), 0) + 1
where not exists (select 1 from public.modules where track_id = (select id from public.tracks where slug = 'yazilim') and ad = 'Yapay Zeka ile Yazılım Geliştirme');

insert into public.modules (track_id, ad, aciklama, sira)
select (select id from public.tracks where slug = 'yazilim'), 'Yapay Zeka ve Derin Öğrenme', 'Derin öğrenmeye giriş: Keras, aktivasyon fonksiyonları, LSTM ve CNN.', coalesce((select max(sira) from public.modules where track_id = (select id from public.tracks where slug = 'yazilim')), 0) + 1
where not exists (select 1 from public.modules where track_id = (select id from public.tracks where slug = 'yazilim') and ad = 'Yapay Zeka ve Derin Öğrenme');

insert into public.modules (track_id, ad, aciklama, sira)
select (select id from public.tracks where slug = 'yazilim'), 'Görüntü İşleme', 'Havadan görüntüleme ve nesne tanıma.', coalesce((select max(sira) from public.modules where track_id = (select id from public.tracks where slug = 'yazilim')), 0) + 1
where not exists (select 1 from public.modules where track_id = (select id from public.tracks where slug = 'yazilim') and ad = 'Görüntü İşleme');

-- Dersler
insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'ortak-temel') and ad = 'Drone Temelleri') m,
(values
  ('İnsansız Hava Araçları ve Kullanım Alanları', 'yN4Zo7AuWz4', 138, 1),
  ('İnsansız Hava Araçlarının Kısa Tarihçesi', 'rv8_niOHkxk', 99, 2),
  ('İHA Türleri', 'DPgL0QA5Es0', 271, 3),
  ('Havacılığın Temel Kavramları', 'Ssz-_CnKCZI', 298, 4),
  ('Hava Hukuku ve Sorumluluklar', 'aAPZEJFjq7o', 1898, 5)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'ortak-temel') and ad = 'Uçuş Kontrol & Kurulum') m,
(values
  ('Uçuş Kontrol Kartı', 'ojglF4fv1PQ', 496, 1),
  ('İHA Yazılım Arayüz Ayarları', '8f-im0KARBg', 809, 2),
  ('İHA Test Uçuşu', 'PEz0mP5WJPM', 1108, 3),
  ('Sensörler ve Otopilot', 'ngCIrmQpHE0', 1205, 4),
  ('Sensörler ve Kestiriciler', '9mSaH1nVdVc', 1100, 5)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'ortak-temel') and ad = 'Aerodinamik ve Uçuş Mekaniği') m,
(values
  ('Hava Aracına Etki Eden Kuvvetler', 'g_-sytuNHds', 345, 1),
  ('Kanat Profili ile İlgili Terimler', 'lW2r_WgH6I8', 88, 2),
  ('Taşıma ve Sürükleme Kuvvetlerinin Hesaplanması', 'te44H9tN7iU', 241, 3),
  ('İtki Kuvveti', 'K7RvbcU4MaE', 175, 4),
  ('Sabit Kanat Hava Araçlarında Stabilite', 'EBZKVwzAmgg', 419, 5),
  ('Aerodinami ve Uçuş Performansı', 'kv8GdI699do', 5199, 6),
  ('Sabit Kanat İHA Aerodinamik ve Uçuş Mekaniği', 'u3q6Ok5UYvw', 5028, 7),
  ('Meteoroloji', 'GCJC4Pwmg7A', 2193, 8)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'ortak-temel') and ad = 'Sabit Kanat Tasarımı') m,
(values
  ('Sabit Kanat Hava Aracı Temel Bileşenleri', 'IuhS70GZkts', 61, 1),
  ('Gövde', 'hnVm6sr8b3c', 115, 2),
  ('Kanatlar', 'UI1hil78dJQ', 201, 3),
  ('Kuyruk', 'iMfPygGD408', 288, 4),
  ('Kanat ve Kuyruk Tipi Seçimi', 'vG4_AIuvvRk', 77, 5),
  ('Kontrol Yüzeyleri', 'ZYBlosZUjI0', 174, 6),
  ('İHA Tasarım ve Konfigürasyon I', 'Nl4abtSX87w', 1903, 7),
  ('İHA Tasarım ve Konfigürasyon II', 'RmuaHIdX0mw', 2805, 8),
  ('Sabit Kanat İHA Tasarım ve Konfigürasyon', 'iDTOg5L2tMg', 926, 9),
  ('Sabit Kanatlı İHA: Tasarım ve Konfigürasyon', 'b64w-ntqbME', 3276, 10),
  ('Sabit Kanat İHA Uygulama Atölyesi', '9bHruQsLa2o', 3693, 11)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'ortak-temel') and ad = 'İHA Tasarım Süreci') m,
(values
  ('İnsansız Hava Aracı Tasarımı için Yol Haritası', '9R_trq9J1k8', 125, 1),
  ('Hedef ve Performans Parametrelerini Belirleme', 'zJ_C_IDZSd0', 105, 2),
  ('Konsept Tasarım Oluşturma', '7m321j6kAv4', 639, 3),
  ('Elektronik Bileşenlerin Seçimi', 'ua90fzH4a60', 308, 4),
  ('Sistem Mimarisi ve Devre Şeması', 'ixcp84KIM6c', 53, 5),
  ('Kavramsal Tasarımı Oluşturma', 'F5KBs91IJto', 473, 6)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'aviyonik') and ad = 'Temel Elektronik') m,
(values
  ('Evde Elektronik için İyi Bir Başlangıç', 'U2hcYfQbAv8', 270, 1),
  ('Evde Elektronik için Gerekli Başlangıç Aletleri ve Devre Elemanları', 'XenMEEAUFYA', 1708, 2),
  ('Elektriği Anlamak (Elektroniği Anlamak)', 'r-um1FCKyPg', 1440, 3),
  ('Breadboard Nedir? Nasıl Kullanılır? (Denerken LED Patlattık! :)', '-1agE4RSpiQ', 674, 4),
  ('Multimetre Nasıl Kullanılır? Multimetre (Avometre) ile Ölçümler Yapmak', 'Pw2C3kpN-2M', 1675, 5),
  ('Direnç Nedir, Nasıl Kullanılır? Dirençler Hakkında Her Şey', 'BlDvU7xjxps', 955, 6),
  ('🔌🔋 Volt, Amper, Watt, Amper-Saat, Watt-Saat Elektrik Ölçü Birimlerinin Örnekli Açıklaması 2/3', 'ZK5fjES_8Pc', 976, 7),
  ('Bilgisayarda Devre Simülasyon Uygulaması (Falstad) 1/2', 'FlB28aPeD3E', 1999, 8),
  ('Bilgisayarda Devre Kurup Çalıştırın (Simulide) - Devre Simülasyon Yazılımı 2/2', 'VBkIxcnc3KQ', 2243, 9)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'aviyonik') and ad = 'Devre Elemanları') m,
(values
  ('Diyot Nedir? Devrede Nasıl Kullanılır? (Diyot + Zener Diyot)', 'bJxcXpBZvx4', 1388, 1),
  ('Datasheet (Bilgi Kağıdı) Nedir, Nasıl Okunur?', 'ovgmgIRke5Y', 1153, 2),
  ('Transistör Nedir, Nasıl Çalışır, Nasıl Kullanılır? (BJT) 1/3', '1r9pNtSAveE', 1873, 3),
  ('MOSFET Transistör Nedir, Nasıl Kullanılır? 2/3', 'OXLiHRuupzM', 1371, 4),
  ('Multimetre ile Transistör Ölçümü - Transistörler Üzerine Faydalı Bilgiler 3/3', 'fmysik8Smn8', 1275, 5),
  ('Voltaj Regülatörleri ve Güç Kaynakları Hakkında Her Şey', 'UqRYFtzGKDw', 1946, 6),
  ('LED Nedir? Nasıl Kullanılır? (Yine LED Patlattım!) 1/2', 'KuSg-8QRwFM', 1919, 7),
  ('Power LED (Güç LEDleri) Nasıl Kullanılır? 7 Segment Gösterge ve Matrix LED 2/2', 'm8jYt3hZVmQ', 1193, 8),
  ('Kapasitör (Kondansatör - Sığaç) Nedir? Nasıl Kullanılır? (Yine Patlattım!)', 'tuNcHdI9QAE', 1371, 9),
  ('Röle (Relay) Nedir? Nasıl Kullanılır? (Reed Röle Dahil)', 'I1I0M7kn8NE', 1059, 10),
  ('Optokuplör (Optocoupler) Nedir? Nasıl Kullanılır? (Arduino Örneği ile)', 'PQalZYUf6gM', 1174, 11),
  ('Sigorta (Fuse) Nedir, Ne İşe Yarar, Nasıl Çalışır?', '6BLMUXV9-Us', 643, 12),
  ('Modülasyon Nedir? PWM Nedir, Ne İşe Yarar? (Detaylı Anlatım)', 'B8TWy575Yig', 1174, 13)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'aviyonik') and ad = 'Aktüatör ve Haberleşme') m,
(values
  ('Uzaktan Kumandalar Nasıl Çalışır? (Kızılötesi ve RF)', 'sML7Z0dYoW8', 1360, 1),
  ('Servo Motor Nedir? İç Yapısı ve Çalışma Prensibi (Osiloskop Ölçümleriyle)', 'F3iGAPx5Leg', 824, 2),
  ('Step Motor (Stepper) Nedir, Nasıl Çalışır? (Sürücü Devre ve Çalışma Prensibi ile)', 'dhzL9snzaJY', 1089, 3),
  ('HC-05, HC-06 Bluetooth Modülleri Hakkında Her Şey (Ayarlama - Kullanım) 1/2', 'FO3ZPemnEyA', 918, 4),
  ('HC-05 Bluetooth Modülü Hakkında Her Şey (Ayarlama - Kullanım) 2/2', '91ox3Uwdeg0', 665, 5)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'aviyonik') and ad = 'İHA Elektronik Sistemleri') m,
(values
  ('Elektronik Sistemlere Genel Bakış', '1ccR99OhHT8', 324, 1),
  ('Motor', 'IGaZCGEjFhI', 354, 2),
  ('Batarya', 'R4XNBVH7PF8', 291, 3),
  ('Küresel Uydu Seyrüsefer Sistemi', 'fYbItD4Rwps', 213, 4),
  ('GNSS GPS ve RTK Teknolojisi', 'DHWzZNyhXSY', 316, 5),
  ('İtki Sistemleri', '75nS8EUdvww', 3138, 6),
  ('İtki Sistemleri (Sabit Kanat)', '9LIUgOKUJYo', 3009, 7),
  ('Radyo Kontrol ve Yer İstasyonları Tasarımı (1)', 'kW2VXpHsCnE', 5627, 8),
  ('Radyo Kontrol ve Yer İstasyonları Tasarımı (2)', 'EfPD-67fyfY', 4977, 9)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'aviyonik') and ad = 'Lehimleme') m,
(values
  ('SMD (Yüzey Montajlı) Parçalar Hakkında Bilmek İstedikleriniz (SMT)', 'KVvFUGMH488', 1439, 1),
  ('SMD Parçalar Nasıl Lehimlenir? (Kalem Havya - Hava Tabancası) Lehimleme Hakkında Püf Noktalar', '4Le04p8s780', 2603, 2)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'aviyonik') and ad = 'PCB Tasarımı (KiCad)') m,
(values
  ('Proteus ISIS''e Alternatif Ücretsiz Baskı Devre (PCB) Çizim Programı: KiCAD 1/2', 'JSZRIqI1Vnk', 1205, 1),
  ('KiCAD ile Baskı Devre (PCB) Çizimi 2/2', 'vzMpjYefElw', 1201, 2),
  ('Profesyonel PCB Üretimi - Tasarladığımız PCB Elimize Ulaştı', 'T5WJCQmwCQE', 624, 3)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'yazilim') and ad = 'Drone Programlama') m,
(values
  ('Drone Programlamaya Giriş', 'bWwmzE7L3ME', 351, 1),
  ('Drone Nedir ve Nasıl Uçar?', 'P9HMaPDzaHo', 803, 2),
  ('Kullanılacak Programlar', 'LS_24cvTFRg', 266, 3),
  ('Sanal Makineye Ubuntu Kurulumu ve Ayarları', 'ayDVGnf2BvQ', 682, 4),
  ('Ardupilot SITL Kurulumu', 'U4synLT64ac', 612, 5),
  ('Gazebo Kurulumu', 't3hqj0ujZnc', 613, 6),
  ('DroneKit Kurulumu ve SITL Bağlantısı', 'TeU2gH_TM9A', 693, 7),
  ('DroneKit Kalkış ve Konum Fonksiyonu', 'hFNNH5d1n-I', 2020, 8),
  ('DroneKit Görev Fonksiyonu', '_TcybPaS2Mk', 1579, 9),
  ('DroneKit Hareket Fonksiyonları', 'vknuMFH5dBk', 939, 10),
  ('Yazılım Geliştirme', 'Zx-dRv8Al3w', 398, 11)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'yazilim') and ad = 'Yapay Zeka ile Yazılım Geliştirme') m,
(values
  ('Backend + FrontEnd + Mobil Uygulama', '7T10-PTQNYE', 283, 1),
  ('Backend Başlangıcı', 'zDdBLvtmegw', 938, 2),
  ('Database ve Endpoint İşlemleri', 'EuZMxCpPKi4', 1743, 3),
  ('Frontend', '4XuGv1fbpfc', 988, 4),
  ('Admin Dashboard', 'DYRXaamYdeg', 560, 5),
  ('Session Mantığı', 'dRalZRAg-_8', 1014, 6),
  ('Sunucu İşlemleri', 'dfG0C1X-GNE', 2512, 7),
  ('DNS İşlemleri', 'SmqwUnPMSH8', 802, 8),
  ('Nginx ve Uvicorn', 'cgyYNwikOo8', 1653, 9),
  ('Android Uygulaması Stiller ve İlk Ekranlar', '8QuihENhO7Q', 1213, 10),
  ('Android Kullanıcı Girişi ve Kategori Seçimi', 'UxQ_FikaYWg', 756, 11),
  ('Android Quiz Ekranı', 'tlRDtDDlh0U', 861, 12),
  ('Android App Kapanış', 'LeZlsZXGRAg', 509, 13)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'yazilim') and ad = 'Yapay Zeka ve Derin Öğrenme') m,
(values
  ('Yapay Zeka & Deep Learning Nedir ?', 'LCfG9Id5Ul8', 1137, 1),
  ('Yapay Zeka Çalışma Prensibi - Tensorflow Playground', 'K3W3PqYRf58', 869, 2),
  ('Keras Sequential Model', 'jB91NXcqjeI', 1017, 3),
  ('Derin Öğrenmede Relu Aktivasyon Fonksiyonu', '2ZhzB6t3jeE', 1392, 4),
  ('Sigmoid Fonksiyon ve Binary Crossentropy ile Mantar Örneği', 'eEvpwWP14Hg', 1521, 5),
  ('Sigmoid Fonksiyon Nedir ? Ne işe Yarar ?', 'DlZR3duRENI', 372, 6),
  ('Binary Crossentropy Nedir ? Ne İşe Yarar ?', 'BtAqD5fGkwg', 741, 7),
  ('Keras Softmax ile Anemi (Anemia) Type Classification Örneği', 'i5ABjJCeFVM', 1775, 8),
  ('LSTM nedir ? Ne İşe Yarar ? - Yapay Zeka (Deep Learning) Dersleri', 'VGtVpeYXl28', 932, 9),
  ('LSTM ile Türkçe SMS Spam Örneği - ❌ Kaggle --- ✅ Hugging Face', 'rvlza1Gvu08', 1749, 10),
  ('CNN Model Nedir Nasıl Çalışır Convolutional, Max Pooling', 'K7CD_pJ8g_c', 929, 11),
  ('Resmi Vektörel Hale Getirme', 'ERRCYd3ocZY', 763, 12)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'yazilim') and ad = 'Görüntü İşleme') m,
(values
  ('Havadan Görüntüleme ve Nesne Tanıma', 'JH9wnGKLD1A', 5536, 1),
  ('Havadan Görüntüleme ve Nesne Tanıma (Sabit Kanat)', 'BBuTfnwRRa4', 5844, 2)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

insert into public.lessons (module_id, baslik, youtube_video_id, sure_sn, sira)
select m.id, v.baslik, v.vid, v.sure, coalesce((select max(sira) from public.lessons where module_id = m.id), 0) + v.k
from (select id from public.modules where track_id = (select id from public.tracks where slug = 'mekanik') and ad = '3D Baskı ve Üretim') m,
(values
  ('İnsansız Hava Araçlarında Yaygın Olarak Kullanılan Malzemeler', 'LlTHmas3Eb0', 739, 1),
  ('3B Yazıcıları Kullanırken Tasarımcıların Dikkat Etmesi Gereken Noktalar', 'fHkDJruX5QQ', 79, 2),
  ('Kompozit Malzemeler', 'ZNdPAWAy0e8', 229, 3),
  ('Parça Üretimi', 'oH8WHD_mcDw', 513, 4),
  ('Montaj', 'XF79hLW6Cpk', 4771, 5)
) as v(baslik, vid, sure, k)
on conflict (module_id, youtube_video_id) do nothing;

commit;
