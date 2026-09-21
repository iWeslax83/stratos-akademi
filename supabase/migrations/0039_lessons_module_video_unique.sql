-- Aynı video aynı modülde iki kez ders olamaz (uygulama katmanı zaten engelliyor; bu ikinci kapı).
--
-- UYGULAMADAN ÖNCE şu sorgu BOŞ dönmeli. Sonuç varsa önce yinelenen dersleri elle temizle,
-- yoksa index oluşturma hata verir:
--
--   select module_id, youtube_video_id, count(*) from public.lessons
--   group by 1, 2 having count(*) > 1;

create unique index if not exists uq_lessons_module_video
  on public.lessons (module_id, youtube_video_id);
