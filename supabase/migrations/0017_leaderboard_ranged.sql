-- Zaman aralıklı liderlik: baslangic null ise tüm zamanlar; değilse o tarihten itibaren
-- gerçekleşen aktivitenin puanı (ders completed_at, quiz created_at, görev reviewed_at).
create or replace function public.leaderboard_ranged(baslangic timestamptz)
returns table (user_id uuid, gorunen_ad text, puan int, sira bigint)
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
    select user_id, sum(best)::int as p from (
      select user_id, quiz_id, max(puan) as best
      from quiz_attempts
      where (baslangic is null or created_at >= baslangic)
      group by user_id, quiz_id
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
           p.ad
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
         puan,
         rank() over (order by puan desc) as sira
  from toplam
  order by puan desc;
$func$;

revoke execute on function public.leaderboard_ranged(timestamptz) from public;
grant execute on function public.leaderboard_ranged(timestamptz) to authenticated;
