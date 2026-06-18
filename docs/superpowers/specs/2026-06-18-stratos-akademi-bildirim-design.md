# Stratos Akademi — Bildirimler Tasarımı

**Tarih:** 2026-06-18
**Durum:** Onaylandı (otonom)
**Önceki:** Pratik görev + onay akışı — `main`'de

## Amaç

Kaptan bir görev gönderimini onayladığında/reddettiğinde üyenin in-app bildirim
alması; Nav'da okunmamış sayacı; `/bildirimler` sayfasında liste.

## Kararlar (otonom)

- Yeni `notifications` tablosu (kullanıcıya özel mesaj + link + okundu).
- Bildirim üretimi: `reviewSubmission` (onay/red) içinde, gönderimin sahibine
  (authenticated admin client, RLS "admin ekler" politikası ile).
- Nav okunmamış sayacını **kendisi** çeker (async server component) — sayfa başına
  wiring yok. RLS "kendi" select ile sadece kendi okunmamışları sayılır.
- **Graceful degradation:** `notifications` tablosu yoksa (migration uygulanmadan)
  sayaç 0, bildirim üretimi best-effort (review'i bozmaz), `/bildirimler` boş. Bu yüzden
  migration'dan ÖNCE de güvenle merge edilebilir.
- Okundu işaretleme: `/bildirimler`'de "Tümünü okundu işaretle" butonu.

## Mimari

### Migration `0016_notifications.sql`
```sql
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mesaj text not null,
  link text,
  okundu boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_user on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;
create policy "notif kendi okur" on public.notifications
  for select to authenticated using (auth.uid() = user_id);
create policy "notif kendi günceller" on public.notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notif admin ekler" on public.notifications
  for insert to authenticated with check (public.is_admin());

grant select, update on public.notifications to authenticated;
grant insert on public.notifications to authenticated;
```

### Saf yardımcı (`web/src/lib/notifications/message.ts`)
```ts
export function taskReviewMessage(durum: "onay" | "red", baslik: string): string;
// onay → `"<baslik>" görevin onaylandı.` ; red → `"<baslik>" görevin reddedildi.`
```

### Veri (`web/src/lib/notifications/queries.ts`)
```ts
export type Notification = { id: string; mesaj: string; link: string | null; okundu: boolean; created_at: string };
export async function getNotifications(supabase): Promise<Notification[]>; // kendi, yeni→eski; hata→[]
export async function unreadCount(supabase): Promise<number>; // kendi okunmamış sayısı; hata→0
```
İkisi de try/catch ile tablo yoksa güvenli döner.

### reviewSubmission (`web/src/app/actions/tasks.ts` — değişir)
- Güncellemeden sonra: gönderimin `user_id` + görev `baslik` + `module_id`'sini oku
  (`task_submissions ... practical_tasks(baslik, module_id)`), `taskReviewMessage` ile mesaj
  üret, `notifications` insert (user_id=sahibi, link=`/mufredat/gorevler/${module_id}`).
  **Best-effort:** try/catch içinde; bildirim hatası review'i BOZMAZ (review zaten ok döndü).

### actions/notifications.ts
```ts
export async function markAllRead(): Promise<{ ok: boolean }>;
// supabase.from("notifications").update({okundu:true}).eq("okundu", false) (RLS kendi)
```

### UI
- `Nav.tsx` (async server component olur): kendi okunmamış sayısını `unreadCount` ile çeker;
  "Bildirimler" linki (`/bildirimler`), sayı>0 ise yanında rozet (sayı). Mevcut prop'lar korunur.
- `AppShell` Nav'ı render eder (async child — RSC'de sorun değil).
- `/bildirimler/page.tsx`: liste (okunmamışlar vurgulu), her biri link'e gider; üstte
  "Tümünü okundu işaretle" (client buton → markAllRead → router.refresh).

## Hata yönetimi
- Tüm okuma/sayım try/catch → güvenli varsayılan (tablo yoksa çökme yok).
- Bildirim üretimi best-effort; review akışını etkilemez.

## Test
**Vitest:** `message.test.ts` — `taskReviewMessage` (onay/red metni). **Elle:** görev onayla/reddet
→ üyede Nav rozeti + `/bildirimler`'de mesaj + linke tıkla; "okundu işaretle" sayacı sıfırlar.

## Kapsam dışı
Gerçek-zamanlı (realtime) bildirim; e-posta; ders/quiz bildirimleri (yalnız görev review).
