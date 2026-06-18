-- Soru açıklaması (yanlış/doğru cevaptan SONRA gösterilir). Submit'ten önce sızmaması için
-- authenticated artık questions'ı kolon-bazlı okur (aciklama HARİÇ) — tıpkı question_options.dogru gibi.
-- aciklama, submitQuiz tarafından service_role ile okunup sonuçla birlikte döndürülür.
alter table public.questions add column if not exists aciklama text;

revoke select on public.questions from authenticated;
grant select (id, quiz_id, metin, sira) on public.questions to authenticated;
-- service_role tam select'i 0006'da verilmişti (admin editör + puanlama için).
