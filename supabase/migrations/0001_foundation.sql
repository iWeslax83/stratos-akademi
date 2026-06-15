-- İzin listesi: kimler giriş yapabilir + rolleri
create table if not exists public.allowlist (
  email text primary key,
  role  text not null default 'uye' check (role in ('uye', 'admin')),
  created_at timestamptz not null default now()
);

-- Üye profilleri (auth.users ile 1:1)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  ad text,
  role text not null default 'uye' check (role in ('uye', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.allowlist enable row level security;
alter table public.profiles enable row level security;

-- Profiller: herkes (giriş yapmış) okur; kişi kendi profilini günceller.
create policy "profiller herkese okunur"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "kendi profilini günceller"
  on public.profiles for update
  using (auth.uid() = id);

-- Allowlist: sadece adminler okur.
create policy "allowlist adminlere okunur"
  on public.allowlist for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Tablo-düzeyi yetkiler (RLS satırları zaten kısıtlar; PostgREST için GRANT şart).
grant select, update on public.profiles to authenticated;
grant select on public.allowlist to authenticated;

-- Yeni auth kullanıcısı: izin listesinde mi diye bak, değilse reddet; varsa profil oluştur.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  allowed_role text;
begin
  select role into allowed_role from public.allowlist where email = new.email;
  if allowed_role is null then
    raise exception 'Bu e-posta izin listesinde değil: %', new.email;
  end if;
  insert into public.profiles (id, email, ad, role, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    allowed_role,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
