# Stratos Akademi — Pratik Görev Puan Entegrasyonu Tasarımı

**Tarih:** 2026-06-18
**Durum:** Onaylandı (otonom — kullanıcı onay kapılarını kaldırdı)
**Önceki:** Pratik Görev v1 (merge 3526b91) ve öncesi — hepsi `main`'de

## Amaç

Onaylanan pratik görevlerin üyenin puanına katkı vermesi (dashboard ⭐ çipi +
liderlik). Orijinal tasarımdaki "onaylanınca puan kazanılır" kapanır.

## Kararlar (otonom)

- Her göreve **`puan int not null default 30`** kolonu; admin düzenleyebilir.
- **Puan formülü:** `ders×20 + Σ(quiz en iyi %) + Σ(onaylı görev puanı)`.
- `computePoints`'e 3. argüman `approvedTaskPoints` (opsiyonel, default 0 → geriye uyumlu).
- Liderlik RPC'ye onaylı görev puanı CTE'si (migration 0014, fonksiyon replace).
- Dosya yükleme bu spec'te DEĞİL (ayrı, sonraki).

## Mimari

### Migration `0014_task_points.sql`
```sql
alter table public.practical_tasks add column if not exists puan int not null default 30;

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

revoke execute on function public.leaderboard() from public;
grant execute on function public.leaderboard() to authenticated;
```

### Saf hesap (`web/src/lib/dashboard/points.ts` — değişir)
```ts
export function computePoints(
  completedCount: number,
  bestQuizScores: number[],
  approvedTaskPoints: number = 0,
): number; // completedCount*20 + Σ bestQuizScores + approvedTaskPoints
```

### DashboardStats / buildStats (`web/src/lib/dashboard/stats.ts` — değişir)
- `buildStats` input'una `approvedTaskPoints: number` eklenir.
- `points = computePoints(overall.done, bestQuizScores, approvedTaskPoints)`.

### getDashboardData (`web/src/lib/dashboard/queries.ts` — değişir)
- Onaylı görev puanı toplamı eklenir:
  ```ts
  const { data: approved } = await supabase
    .from("task_submissions")
    .select("practical_tasks(puan)")
    .eq("user_id", userId)
    .eq("durum", "onay");
  // approvedTaskPoints = Σ row.practical_tasks.puan
  ```
- Dönüş tipine `approvedTaskPoints: number` eklenir; `/panom` page bunu `buildStats`'a geçirir.

### Görev `puan` alanı (tanım + UI)
- `PracticalTask` tipine (`lib/tasks/queries.ts`) `puan: number` eklenir; select'lere `puan`.
- `createTask`/`updateTask` (actions/tasks.ts) `puan` okur (`intOr(fd,"puan",30)`).
- `TaskForm` (components/admin) "Puan" sayı alanı (default 30).
- Admin görev listesi + üye görev kartı görevin puanını gösterir ("30 puan").

## Veri akışı

```
/panom → getDashboardData → approvedTaskPoints → buildStats → points (⭐ çip)
/liderlik → leaderboard() RPC (artık görev puanı dahil)
Admin görev CRUD → puan alanı kaydedilir
```

## Hata yönetimi
Mevcut kalıplar korunur; yeni hata yolu yok. RPC görev puanı yoksa coalesce(…,0).

## Test
**Vitest:** `points.test.ts` güncellenir (3. argüman: `computePoints(8,[90,75],60)=385`; default 0 ile mevcut testler geçer). `stats.test.ts` güncellenir (approvedTaskPoints input + points doğrulaması). **Elle:** görev onayla → dashboard puanı + liderlik artar; admin görev puanını düzenler.

## Kapsam dışı
Dosya/foto yükleme (Storage) — sonraki spec. Görev puanını yetkinlik/rozetle ilişkilendirme.
