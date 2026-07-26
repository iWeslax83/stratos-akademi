-- 0037: admin manuel stratosiha.com foto eşleştirmesi.
--
-- 1) profiles.stratosiha_ad: admin'in site.json'dan seçtiği isim (null = otomatik
--    ad-bazlı eşleştirmeye düş). 2) guard_profile_role() genişletildi: ad ve
--    stratosiha_ad da role gibi yalnız admin/service_role tarafından değiştirilebilir
--    (2026-07-14 spec'in UI'dan kaldırdığı ama DB'de hiç kapatmadığı deliği de kapatır).
-- 3) leaderboard()/leaderboard_ranged()/member_profile(): tam_ad + stratosiha_ad eklendi.
--    Bu üçü bugüne dek yalnız KISALTILMIŞ gorunen_ad ("Emir S.") ile foto eşleştirmeye
--    çalışıyordu — site.json'daki tam isimle ("Emir Sakarya") hiç eşleşmiyordu. Bu
--    değişiklik hem yeni manuel linki hem de o var olan bug'ı düzeltir.

alter table public.profiles add column if not exists stratosiha_ad text;

create or replace function public.guard_profile_role()
returns trigger
language plpgsql
as $func$
begin
  if (new.role is distinct from old.role
      or new.ad is distinct from old.ad
      or new.stratosiha_ad is distinct from old.stratosiha_ad)
     and current_user = 'authenticated'
     and not public.is_admin() then
    raise exception 'Ad, eşleştirme veya yetki (role) değişimi yalnız adminlere açıktır.';
  end if;
  return new;
end;
$func$;

drop function if exists public.leaderboard();
create function public.leaderboard()
returns table (user_id uuid, gorunen_ad text, tam_ad text, stratosiha_ad text, puan int, sira bigint)
language sql
stable
security definer
set search_path = public
as $func$
  with ders as (
    select user_id, count(*) * 20 as p
    from lesson_progress where completed = true group by user_id
  ),
  quiz as (
    select user_id, sum(ilk)::int as p from (
      select distinct on (user_id, quiz_id) user_id, quiz_id, puan as ilk
      from quiz_attempts
      order by user_id, quiz_id, created_at
    ) t group by user_id
  ),
  gorev as (
    select s.user_id, sum(t.puan)::int as p
    from task_submissions s
    join practical_tasks t on t.id = s.task_id
    where s.durum = 'onay'
    group by s.user_id
  ),
  toplam as (
    select p.id as user_id,
           coalesce(d.p,0) + coalesce(q.p,0) + coalesce(g.p,0) as puan,
           p.ad,
           p.stratosiha_ad
    from profiles p
    left join ders d on d.user_id = p.id
    left join quiz q on q.user_id = p.id
    left join gorev g on g.user_id = p.id
  )
  select user_id,
         case
           when coalesce(nullif(trim(ad), ''), '') = '' then 'Üye'
           when position(' ' in trim(ad)) = 0 then trim(ad)
           else split_part(trim(ad), ' ', 1) || ' ' ||
                upper(left(split_part(trim(ad), ' ', 2), 1)) || '.'
         end as gorunen_ad,
         ad as tam_ad,
         stratosiha_ad,
         puan,
         rank() over (order by puan desc) as sira
  from toplam
  order by puan desc;
$func$;
revoke execute on function public.leaderboard() from public;
grant execute on function public.leaderboard() to authenticated;

drop function if exists public.leaderboard_ranged(timestamptz);
create function public.leaderboard_ranged(baslangic timestamptz)
returns table (user_id uuid, gorunen_ad text, tam_ad text, stratosiha_ad text, puan int, sira bigint)
language sql
stable
security definer
set search_path = public
as $func$
  with ders as (
    select user_id, count(*) * 20 as p
    from lesson_progress
    where completed = true and (baslangic is null or completed_at >= baslangic)
    group by user_id
  ),
  quiz as (
    select user_id, sum(ilk)::int as p from (
      select distinct on (user_id, quiz_id) user_id, quiz_id, puan as ilk
      from quiz_attempts
      where (baslangic is null or created_at >= baslangic)
      order by user_id, quiz_id, created_at
    ) t group by user_id
  ),
  gorev as (
    select s.user_id, sum(t.puan)::int as p
    from task_submissions s
    join practical_tasks t on t.id = s.task_id
    where s.durum = 'onay' and (baslangic is null or s.reviewed_at >= baslangic)
    group by s.user_id
  ),
  toplam as (
    select p.id as user_id,
           coalesce(d.p,0) + coalesce(q.p,0) + coalesce(g.p,0) as puan,
           p.ad,
           p.stratosiha_ad
    from profiles p
    left join ders d on d.user_id = p.id
    left join quiz q on q.user_id = p.id
    left join gorev g on g.user_id = p.id
  )
  select user_id,
         case
           when coalesce(nullif(trim(ad), ''), '') = '' then 'Üye'
           when position(' ' in trim(ad)) = 0 then trim(ad)
           else split_part(trim(ad), ' ', 1) || ' ' ||
                upper(left(split_part(trim(ad), ' ', 2), 1)) || '.'
         end as gorunen_ad,
         ad as tam_ad,
         stratosiha_ad,
         puan,
         rank() over (order by puan desc) as sira
  from toplam
  order by puan desc;
$func$;
revoke execute on function public.leaderboard_ranged(timestamptz) from public;
grant execute on function public.leaderboard_ranged(timestamptz) to authenticated;

drop function if exists public.member_profile(uuid);
create function public.member_profile(p_user_id uuid)
returns table (
  gorunen_ad text,
  tam_ad text,
  stratosiha_ad text,
  puan int,
  tamamlanan_ders int,
  onayli_gorev int,
  sira bigint,
  yetkinlikler text[]
)
language sql
stable
security definer
set search_path = public
as $func$
  with ders as (
    select user_id, count(*) as c, count(*) * 20 as p
    from lesson_progress where completed = true group by user_id
  ),
  quiz as (
    select user_id, sum(best)::int as p from (
      select user_id, quiz_id, max(puan) as best
      from quiz_attempts group by user_id, quiz_id
    ) t group by user_id
  ),
  gorev as (
    select s.user_id,
           count(*) filter (where s.durum = 'onay') as c,
           coalesce(sum(t.puan) filter (where s.durum = 'onay'), 0)::int as p
    from task_submissions s join practical_tasks t on t.id = s.task_id
    group by s.user_id
  ),
  toplam as (
    select pr.id as user_id,
           coalesce(d.p,0) + coalesce(q.p,0) + coalesce(g.p,0) as puan
    from profiles pr
    left join ders d on d.user_id = pr.id
    left join quiz q on q.user_id = pr.id
    left join gorev g on g.user_id = pr.id
  )
  select
    (select case
              when coalesce(nullif(trim(ad), ''), '') = '' then 'Üye'
              when position(' ' in trim(ad)) = 0 then trim(ad)
              else split_part(trim(ad), ' ', 1) || ' ' ||
                   upper(left(split_part(trim(ad), ' ', 2), 1)) || '.'
            end
     from profiles where id = p_user_id),
    (select ad from profiles where id = p_user_id),
    (select stratosiha_ad from profiles where id = p_user_id),
    coalesce((select puan from toplam where user_id = p_user_id), 0)::int,
    coalesce((select c from ders where user_id = p_user_id), 0)::int,
    coalesce((select c from gorev where user_id = p_user_id), 0)::int,
    (select count(*) + 1 from toplam
       where puan > coalesce((select puan from toplam where user_id = p_user_id), 0)),
    coalesce((select array_agg(track_slug) from user_competencies where user_id = p_user_id), array[]::text[])
$func$;
revoke execute on function public.member_profile(uuid) from public;
grant execute on function public.member_profile(uuid) to authenticated;
