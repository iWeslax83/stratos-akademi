-- auth.uid() admin mi? SECURITY DEFINER → profiles'a RLS özyinelemesine girmeden okur.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$func$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admin yazma politikaları (mevcut SELECT "okunur" politikaları durur; OR'lanır,
-- üye okuması bozulmaz). Yazma yalnız is_admin() true ise.
create policy "tracks admin yazar" on public.tracks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "modules admin yazar" on public.modules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "lessons admin yazar" on public.lessons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant insert, update, delete on public.tracks to authenticated;
grant insert, update, delete on public.modules to authenticated;
grant insert, update, delete on public.lessons to authenticated;
