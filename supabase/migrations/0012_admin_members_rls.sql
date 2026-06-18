-- allowlist: admin yazma (mevcut "allowlist adminlere okunur" SELECT durur; OR'lanır).
create policy "allowlist admin yazar" on public.allowlist
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant insert, update, delete on public.allowlist to authenticated;

-- profiles: admin başkasının profilini güncelleyebilir (rol değişimi için).
-- Mevcut "kendi profilini günceller" + "profiller herkese okunur" durur.
create policy "profiles admin günceller" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
