-- Bir üyenin herkese açık profili için toplu, hassas-olmayan veri (e-posta YOK).
-- SECURITY DEFINER: ham progress/competency satırlarını açmadan yalnız özet döner.
create or replace function public.member_profile(p_user_id uuid)
returns table (
  gorunen_ad text,
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
    coalesce((select puan from toplam where user_id = p_user_id), 0)::int,
    coalesce((select c from ders where user_id = p_user_id), 0)::int,
    coalesce((select c from gorev where user_id = p_user_id), 0)::int,
    (select count(*) + 1 from toplam
       where puan > coalesce((select puan from toplam where user_id = p_user_id), 0)),
    coalesce((select array_agg(track_slug) from user_competencies where user_id = p_user_id), array[]::text[])
$func$;

revoke execute on function public.member_profile(uuid) from public;
grant execute on function public.member_profile(uuid) to authenticated;
