# Stratos Akademi — Tam Dashboard Tasarımı

**Tarih:** 2026-06-17
**Durum:** Onaylandı
**Önceki:** Foundation, Müfredat, Quiz (hepsi `main`'de)

## Amaç

`/panom` (Panom) sayfasını mockup'taki tam bento dashboard'a çıkarmak: kaldığın
yer kartı, toplam ilerleme halkası, dal kartları, günlük seri (streak), puan,
güvenli liderlik tablosu ve dal yetkinlikleri — hepsi gerçek veriyle.

Mockup: `.superpowers/brainstorm/4133220-1781514975/content/dashboard.html`

## Kapsam ve Fazlar

Tek spec, **3 bağımsız teslim edilebilir faz**. Hepsi `/panom` bento yüzeyini
paylaşır. Ortak çekirdek: tüm istatistikler tek bir `DashboardStats` nesnesinden
türetilir (tek sefer hesapla, her yerde kullan).

- **Faz 1 — Bento + türetilen istatistikler:** layout, kaldığın yer kartı
  (modül-içi ilerleme + kalan süre), toplam ilerleme halkası, dal kartları,
  streak, puan.
- **Faz 2 — Liderlik:** güvenli `SECURITY DEFINER` RPC + mini tablo (top 3 +
  sen) + tam `/liderlik` sayfası + Nav linki.
- **Faz 3 — Yetkinlikler:** `user_competencies` tablosu + dal tamamlama
  yetkinlikleri + sade kazanma bildirimi.

Her faz tek başına çalışır halde teslim edilir.

## Kararlar (kilitli)

### Puan formülü
```
puan = (tamamlanan ders sayısı × 20) + Σ (her quizin EN İYİ yüzde puanı)
```
- Sadece en iyi quiz denemesi sayılır (kullanıcı + quiz başına).
- Örnek: 8 ders + Quiz1 %90 + Quiz2 %75 = 160 + 90 + 75 = **325**.

### Streak (günlük seri)
- **Aktivite günü** = o gün en az bir ders tamamlandı (`lesson_progress.completed_at`)
  VEYA bir quiz denemesi gönderildi (`quiz_attempts.created_at`).
- Saat dilimi: **Türkiye (Europe/Istanbul)**. Zaman damgaları bu TZ'de güne yuvarlanır.
- Seri = peş peşe aktif gün sayısı; en yeni aktif gün **bugün veya dün** olmalı
  (1 gün tolerans). Aksi halde seri 0.

### Liderlik
- Diğer üyelerin puanını okumak RLS'yi aşar → `SECURITY DEFINER` RPC.
- RPC sadece **görünen ad + puan + sıra** döndürür; **e-posta asla dönmez**.
- Görünen ad formatı: **"Ad S."** (ad tam, soyadın ilk harfi + nokta), SQL'de
  türetilir. Ad boşsa fallback "Üye".
- `revoke execute from public; grant execute to authenticated`.

### Yetkinlikler (eski "rozetler")
- Yetkinlik = **dal tamamlama**. 5 dal = 5 yetkinlik (müfredattaki dal sayısı
  kadar). Sayma/seri/quiz bazlı yapay rozet **yok**.
- Kazanım kuralı: dal %100 tamamlandı (o dalın tüm dersleri `completed`).
- Dalın kendi `tracks.ikon`'u kullanılır.
- `user_competencies` tablosunda kalıcı + `earned_at`. Dashboard açılınca server
  action yeni biteni kaydeder → sade bildirim: "Yeni yetkinlik: Elektronik".

## Mimari

### Veri katmanı

**Saf, test edilebilir modüller** (`web/src/lib/dashboard/`):

- `points.ts`
  ```ts
  export function computePoints(completedCount: number, bestQuizScores: number[]): number
  // completedCount * 20 + sum(bestQuizScores)
  ```
- `streak.ts`
  ```ts
  export function computeStreak(activityDates: Date[], today: Date): number
  // Türkiye TZ'de güne yuvarla → tekille → desc sırala →
  // en yeni gün bugün/dün değilse 0 → peş peşe günleri say
  ```
- `competencies.ts`
  ```ts
  import type { TrackProgress } from "@/lib/curriculum/types";
  export function earnedCompetencies(perTrack: TrackProgress[]): string[]
  // pct === 100 olan dalların slug'ları
  ```
- `stats.ts` — tip + birleştirici
  ```ts
  import type { TrackProgress } from "@/lib/curriculum/types";
  export type DashboardStats = {
    completedCount: number;
    bestQuizScores: number[];
    streak: number;
    points: number;
    perTrack: TrackProgress[];
    overall: { done: number; total: number; pct: number };
    earnedCompetencies: string[]; // track slugs
  };
  ```

**`web/src/lib/curriculum/types.ts`'e eklenecek:**
- `export type TrackProgress = { slug: string; ad: string; ikon: string | null; done: number; total: number; pct: number };`
  (Burada tanımlanır çünkü `trackProgress` müfredat katmanında yaşar; `dashboard/`
  bunu import eder — bağımlılık dashboard → curriculum yönünde, doğru.)

**`web/src/lib/curriculum/progress.ts`'e eklenecek (saf):**
- `trackProgress(curriculum, completedIds): TrackProgress[]` — dal başına done/total/pct.
- `moduleProgress(module, completedIds): { done: number; total: number; pct: number; kalanSure_sn: number }`
  — kaldığın yer kartının "%40 · ~12 dk kaldı" satırı için (kalan = tamamlanmamış
  derslerin `sure_sn` toplamı).

**Sorgu birleştirici** `web/src/lib/dashboard/queries.ts`:
- `getDashboardData(supabase, userId): Promise<{ curriculum, completedIds, completedAt: Date[], bestQuizScores: number[], quizActivityDates: Date[] }>`
  - `lesson_progress` → `lesson_id, completed_at` (completed = true).
  - quiz en iyi puanları → `quiz_attempts` `user_id` ile gruplanır, `quiz_id` başına `max(puan)`.
  - aktivite tarihleri = `completed_at` (dersler) ∪ `created_at` (tüm quiz denemeleri).

**Liderlik** `web/src/lib/dashboard/leaderboard.ts`:
- `getLeaderboard(supabase): Promise<LeaderRow[]>` — RPC'yi çağırır.
  `LeaderRow = { userId: string; gorunenAd: string; puan: number; sira: number }`.

### SQL Göçleri

**`supabase/migrations/0008_leaderboard_rpc.sql`:**
```sql
create or replace function public.leaderboard()
returns table (user_id uuid, gorunen_ad text, puan int, sira bigint)
language sql
security definer
set search_path = public
as $$
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
           p.ad, p.email
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
$$;

revoke execute on function public.leaderboard() from public;
grant execute on function public.leaderboard() to authenticated;
```
Güvenlik: fonksiyon kullanıcı girdisi almaz (enjeksiyon yok); yalnız toplulaştırılmış,
hassas olmayan veri (ad + puan) döner; e-posta sadece içeride okunur, dışarı çıkmaz;
execute yalnız `authenticated`'a verilir.

**`supabase/migrations/0009_user_competencies.sql`:**
```sql
create table if not exists public.user_competencies (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_slug text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, track_slug)
);
alter table public.user_competencies enable row level security;
create policy "yetkinlik kendi okunur" on public.user_competencies
  for select to authenticated using (auth.uid() = user_id);
create policy "yetkinlik kendi eklenir" on public.user_competencies
  for insert to authenticated with check (auth.uid() = user_id);
grant select, insert on public.user_competencies to authenticated;
```

### Server Action

`web/src/app/actions/competencies.ts`:
```ts
export async function syncCompetencies(userId: string, earnedSlugs: string[]): Promise<{ yeni: string[] }>
```
- `userId` parametre olarak alınır (page zaten `user.id`'ye sahip). Server action
  içinde `auth.getUser()` **çağrılmaz** — quiz'de yaşanan refresh-token rotasyon
  yarışını tetiklememek için (bkz. hafıza: auth dersleri). Güvenlik RLS'e dayanır:
  insert satırına `user_id` açıkça yazılır, `with check (auth.uid() = user_id)`
  yanlış kullanıcıyı reddeder.
- Akış: mevcut `user_competencies` satırlarını okur → `earnedSlugs`'ta olup
  tabloda olmayanları insert eder → **yeni eklenenleri** döner (bildirim için).
- try/catch ile sarılır; hata → `{ yeni: [] }` (dashboard'u bozmaz).

### Bileşenler (`web/src/components/dashboard/`)

- `StatRing.tsx` — konik gradyan ilerleme halkası (toplam %), server bileşeni
  (inline style ile `--p`).
- `StatCard.tsx` — genel istatistik kutusu (ikon + büyük sayı + etiket); streak ve
  puan için.
- `ResumeCard.tsx` — kaldığın yer kahramanı: kapak + dal/modül etiketi + başlık +
  modül ilerleme barı + "~N dk kaldı" + Devam et butonu. (Mevcut `/panom`'daki
  inline kart buraya taşınır ve modül ilerlemesiyle zenginleşir.)
- `TrackList.tsx` — "Öğrenme dalların": dal ikonu + ad + modül sayısı + mini bar + %.
- `LeaderboardMini.tsx` — top 3 (madalya) + sen (vurgulu satır). "Tablo →" linki `/liderlik`.
- `CompetencyShelf.tsx` — "Yetkinliklerin · N/5": her dal için ikon kutusu,
  kazanılan ✓ / kilitli (gri). Sıralama satırı (#N) da bu bölgede.
- `CompetencyToast.tsx` — client; yeni kazanılan yetkinlikler için sade bildirim,
  birkaç saniye sonra kaybolur.

### Sayfalar / Rota

- `web/src/app/panom/page.tsx` — bento'ya dönüştürülür (server). `getDashboardData`
  → `DashboardStats` → `syncCompetencies(user.id, earned)` → bileşenler +
  `CompetencyToast` (yeni rozetler).
- `web/src/app/liderlik/page.tsx` — yeni; tüm üyeler, `getLeaderboard`. Sen vurgulu.
- `web/src/components/shell/Nav.tsx` — "Liderlik" linki eklenir.

## Veri Akışı

```
/panom (server)
  → getDashboardData(supabase, user.id)
  → computePoints, computeStreak, trackProgress, earnedCompetencies
  → DashboardStats
  → syncCompetencies(user.id, stats.earnedCompetencies)  // yeni rozetleri kaydet+dön
  → <ResumeCard/> <StatRing/> <StatCard streak/> <StatCard puan/>
    <TrackList/> <LeaderboardMini/> <CompetencyShelf/>
  → <CompetencyToast yeni={...}/>   (client)

/liderlik (server) → getLeaderboard(supabase) → tablo (sen vurgulu)
```

## Hata Yönetimi

- Tüm sorgular güvenli varsayılan döner (veri yok → 0 / boş dizi).
- Liderlik RPC başarısız → `LeaderboardMini`/`/liderlik` "Liderlik şu an
  yüklenemedi" gösterir; dashboard'un kalanı çalışır.
- `syncCompetencies` try/catch içinde; hata → `{ yeni: [] }`, sayfa çökmez.
- Müfredat boşsa: ResumeCard "Müfredat yakında", dal listesi boş durum.

## Test

**Vitest birim testleri (saf fonksiyonlar):**
- `points.test.ts` — formül: 0 ders 0 quiz → 0; 8 ders + [90,75] → 325; sadece
  ders; sadece quiz.
- `streak.test.ts` — bugün biten 3 gün → 3; dün biten → korunur; 2 gün önce → 0;
  aynı günde çoklu aktivite → 1 sayılır; boş → 0; TZ sınırı (gece yarısı).
- `competencies.test.ts` — pct===100 olan dalları döner; hiçbiri → boş; hepsi → tümü.
- `trackProgress.test.ts` / `moduleProgress.test.ts` — done/total/pct; kalan süre toplamı.

**Elle doğrulama (dev sunucu loglarıyla):**
- `leaderboard()` RPC: birden çok kullanıcı, doğru sıralama, "Ad S." formatı,
  e-posta sızmıyor.
- RLS: `user_competencies` başka kullanıcının satırını okuyamaz.
- Yetkinlik kazanma anı: bir dalı bitir → bildirim çıkar → ikinci açılışta çıkmaz.

## Kapsam dışı (sonraki)

- Admin panel (içerik + quiz CRUD).
- Pratik görev gönderimi + onayı.
- Puan/streak için zamanla değişen "haftalık" liderlik, bildirim geçmişi.
