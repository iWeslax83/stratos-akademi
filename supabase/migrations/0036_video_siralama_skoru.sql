-- Öneri sıralaması artık uygunluk + izlenme + tazelik bileşiminden çıkıyor.
-- Skoru yazıyoruz ki admin panelinde sıralama, kartta gösterilen sayıyla aynı olsun.

alter table public.video_suggestions
  add column if not exists siralama_skoru numeric(5,2);

-- Kuyruktaki eski öneriler NULL kalırsa sıralamanın dibine düşerler. Formül burada
-- lib/videos/kalite.ts'teki AGIRLIK ile birebir tekrar ediyor — bu tek seferlik bir
-- geri doldurma; ağırlıklar değişirse bu migration'a DOKUNMA, yeni tarama zaten
-- yeni skorla yazar, elde kalan eski satırlar da er geç kuyruktan çıkar.
update public.video_suggestions set siralama_skoru = 100 * (
    0.75 * (least(greatest(coalesce(uygunluk_skoru, 0), 0), 100) / 100.0)
  + 0.15 * least(1, ln(1 + coalesce(izlenme, 0)) / ln(1 + 1000000))
  + 0.10 * coalesce(
      greatest(0, least(1,
        1 - (extract(epoch from (now() - yayin_tarihi)) / (365.25 * 86400)) / 4
      )), 0)
)
where siralama_skoru is null;

-- Bekleyen kuyruk skora göre sıralı okunuyor.
create index if not exists idx_video_sug_durum_siralama
  on public.video_suggestions(durum, siralama_skoru desc);
