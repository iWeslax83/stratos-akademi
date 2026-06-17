-- Liderlik: diğer üyelerin puanını okumak RLS'i aşar → SECURITY DEFINER fonksiyon.
-- Yalnız görünen ad ("Ad S.") + puan + sıra döner; e-posta asla dışarı çıkmaz.
create or replace function public.leaderboard()
returns table (user_id uuid, gorunen_ad text, puan int, sira bigint)
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
    select user_id, sum(best)::int as p from (
      select user_id, quiz_id, max(puan) as best
      from quiz_attempts group by user_id, quiz_id
    ) t group by user_id
  ),
  toplam as (
    select p.id as user_id,
           coalesce(d.p,0) + coalesce(q.p,0) as puan,
           p.ad
    from profiles p
    left join ders d on d.user_id = p.id
    left join quiz q on q.user_id = p.id
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

revoke execute on function public.leaderboard() from public;
grant execute on function public.leaderboard() to authenticated;
