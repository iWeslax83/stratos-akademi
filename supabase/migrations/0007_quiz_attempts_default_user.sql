-- quiz_attempts.user_id varsayılanı: oturumdaki kullanıcı (auth.uid()).
-- submitQuiz action'ı artık getUser çağırmıyor (refresh-token rotasyon sorununu önlemek için);
-- insert sırasında user_id'yi DB bu default ile doldurur, RLS de auth.uid() = user_id doğrular.
alter table public.quiz_attempts alter column user_id set default auth.uid();
