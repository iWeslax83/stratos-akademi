-- Quiz tablolarına admin yazma (is_admin() 0010'da tanımlı). Mevcut SELECT
-- politikaları durur; OR'lanır. question_options.dogru SELECT'i üyelere kapalı
-- kalır (kolon grant'i değişmez); admin editörü dogru'yu service_role ile okur.
create policy "quizzes admin yazar" on public.quizzes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "questions admin yazar" on public.questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "options admin yazar" on public.question_options
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Tablo düzeyi DML grant'i dogru kolonunu da kapsar; yazma yalnız is_admin() ile.
grant insert, update, delete on public.quizzes to authenticated;
grant insert, update, delete on public.questions to authenticated;
grant insert, update, delete on public.question_options to authenticated;
