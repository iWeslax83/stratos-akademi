-- Kaynak kütüphanesi: kaptanlar referans bağlantıları paylaşır (datasheet, CAD, BOM,
-- repo, harici kılavuz). Dosya YÜKLEME yok — link tabanlı (Storage gerekmez).
-- Okuma herkese açık (authenticated); yazma yalnız admin. author_id default auth.uid().

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  baslik text not null,
  url text not null,
  kategori text not null default 'Genel',
  aciklama text,
  author_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_resources_kategori on public.resources(kategori, created_at desc);

alter table public.resources enable row level security;

create policy "kaynak okunur" on public.resources
  for select to authenticated using (true);
create policy "kaynak admin yazar" on public.resources
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- RLS tek başına yetmez; SQL editörle kurulan tabloya grant ŞART (yoksa 42501).
grant select, insert, update, delete on public.resources to authenticated;
