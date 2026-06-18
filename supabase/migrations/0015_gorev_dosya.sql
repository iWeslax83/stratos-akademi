insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gorev-dosyalari', 'gorev-dosyalari', false, 5242880,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

alter table public.task_submissions add column if not exists dosya_yolu text;

-- storage.objects RLS (storage'da RLS zaten açık). İmzalı URL'ler service_role ile üretilir;
-- okuma politikası tutarlılık + ileride istemci önizleme için.
create policy "gorev dosya yükle" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'gorev-dosyalari' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "gorev dosya okunur (kendi veya admin)" on storage.objects
  for select to authenticated
  using (bucket_id = 'gorev-dosyalari'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "gorev dosya kendi günceller" on storage.objects
  for update to authenticated
  using (bucket_id = 'gorev-dosyalari' and (storage.foldername(name))[1] = auth.uid()::text);
