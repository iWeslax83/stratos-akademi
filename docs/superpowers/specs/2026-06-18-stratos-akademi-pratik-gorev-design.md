# Stratos Akademi — Pratik Görev v1 Tasarımı

**Tarih:** 2026-06-18
**Durum:** Onaylandı
**Önceki:** Foundation, Müfredat, Quiz, Dashboard, Admin (Müfredat+Quiz+Üye) — hepsi `main`'de

## Amaç

Üyelerin modül başına tanımlanmış pratik görevlere link/metin gönderebilmesi ve
kaptanın (admin) bunları onaylayıp/reddedip geri bildirim verebilmesi.

## Kapsam ve karar özeti

- **İlk dilim:** görev tanımı (modül başına çok görev, link/metin) + üye gönderimi
  + kaptan onay kuyruğu + geri bildirim.
- **Kapsam dışı (sonraki spec'ler):** dosya/foto yükleme (Supabase Storage), puan
  entegrasyonu, son teslim tarihi, bildirim.
- Gönderim **(user, task) başına tek satır** (upsert); onaylanınca kilit.
- **RLS self-approval engeli:** üye kendi gönderimini yalnız "beklemede" olarak
  düzenler; onay/red yalnız admin.
- 3 faz: şema/RLS + admin görev CRUD · üye gönderim · onay kuyruğu.

## Mimari

### Şema (migration `0013_practical_tasks.sql`)
```sql
create table if not exists public.practical_tasks (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  baslik text not null,
  aciklama text,
  sira int not null default 0
);

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.practical_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  icerik text not null,
  durum text not null default 'beklemede' check (durum in ('beklemede','onay','red')),
  geri_bildirim text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, task_id)
);

create index if not exists idx_tasks_module on public.practical_tasks(module_id, sira);
create index if not exists idx_subs_task on public.task_submissions(task_id);
create index if not exists idx_subs_durum on public.task_submissions(durum);

alter table public.practical_tasks enable row level security;
alter table public.task_submissions enable row level security;
```

### RLS (kritik)
```sql
-- practical_tasks: herkes okur; admin yazar.
create policy "tasks okunur" on public.practical_tasks
  for select to authenticated using (true);
create policy "tasks admin yazar" on public.practical_tasks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- task_submissions
create policy "sub okunur (kendi veya admin)" on public.task_submissions
  for select to authenticated using (auth.uid() = user_id or public.is_admin());
-- Üye yalnız kendi gönderimini 'beklemede' olarak ekler.
create policy "sub üye ekler" on public.task_submissions
  for insert to authenticated with check (auth.uid() = user_id and durum = 'beklemede');
-- Üye onaylanmamış gönderimini düzenler; durumu yalnız 'beklemede' yapabilir (self-approval engeli).
create policy "sub üye günceller" on public.task_submissions
  for update to authenticated
  using (auth.uid() = user_id and durum <> 'onay')
  with check (auth.uid() = user_id and durum = 'beklemede');
-- Admin inceler (onay/red + geri bildirim).
create policy "sub admin günceller" on public.task_submissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.practical_tasks to authenticated;
grant insert, update, delete on public.practical_tasks to authenticated;
grant select, insert, update on public.task_submissions to authenticated;
```
Notlar:
- `practical_tasks` "tasks admin yazar" `for all` SELECT'i de kapsar ama "tasks
  okunur" SELECT politikası `using(true)` ile tüm üyelere açık; OR'lanır.
- Üye `task_submissions`'da DELETE alamaz (gönderim silinmez; düzenlenir).
- Self-approval engeli RLS WITH CHECK ile: üye `durum`'u yalnız 'beklemede' yapabilir.

### Saf yardımcılar (`web/src/lib/tasks/status.ts`)
```ts
export type SubmissionStatus = "beklemede" | "onay" | "red";
export function canEditSubmission(durum: SubmissionStatus | null): boolean; // null (gönderim yok) veya 'onay' değilse true
export function submissionStatusLabel(durum: SubmissionStatus | null): string; // null→"Gönderilmedi", beklemede→"Beklemede", onay→"Onaylandı", red→"Reddedildi"
```

### Veri okuma (`web/src/lib/tasks/queries.ts`)
- `getModuleTasks(supabase, moduleId, userId)` → o modülün görevleri + her görev için
  kullanıcının gönderimi (varsa). `{ task, submission|null }[]`.
- `getPendingSubmissions(supabase)` → durum='beklemede' tüm gönderimler + görev başlığı
  + modül/dal adı + gönderen e-posta (admin onay kuyruğu için). RLS admin SELECT'i ile.
  (Join: task_submissions → practical_tasks → modules → tracks; user e-postası profiles'tan.)

### Server actions (`web/src/app/actions/tasks.ts`, `{ok,error}`)
- `submitTask(taskId: string, icerik: string)` — üye gönderimi upsert: `(user_id, task_id)`
  unique → varsa update (icerik, durum='beklemede', geri_bildirim=null, reviewed_by=null,
  reviewed_at=null), yoksa insert. `user_id` server'da `auth.uid()` DEĞİL — quiz dersine
  uygun: page'den `userId` parametresi + RLS `with check` doğrular. **Karar:** `submitTask(taskId, icerik, userId)`.
  Boş içerik → hata.
- Admin tanım CRUD: `createTask(fd)` [module_id, baslik, aciklama, sira], `updateTask(fd)`
  [id, baslik, aciklama, sira], `deleteTask(id)`.
- `reviewSubmission(id, durum, geri_bildirim, adminId)` — durum∈{onay,red}; geri_bildirim
  (red için zorunlu, onay için opsiyonel); reviewed_by=adminId, reviewed_at=now().

Hepsi try/catch + `errMsg` (RLS reddini dostça çevirir) + `revalidatePath`.

### UI

**Üye:**
- Ders sayfası (`/mufredat/[lessonId]`): modülde görev varsa "Pratik Görevler (N) →"
  kartı → `/mufredat/gorevler/[moduleId]`.
- `web/src/app/mufredat/gorevler/[moduleId]/page.tsx`: görev listesi; her görev:
  başlık + açıklama + `SubmissionForm` (link/metin textarea + Gönder; `canEditSubmission`
  false ise kilit) + durum rozeti (`submissionStatusLabel`) + varsa geri bildirim.

**Admin:**
- Modül admin sayfası: "Pratik Görevler" linki → `/admin/mufredat/[trackId]/[moduleId]/gorevler`
  (görev CRUD: liste + ekle/düzenle/sil; baslik, aciklama, sira).
- Onay kuyruğu `web/src/app/admin/onaylar/page.tsx`: bekleyen gönderimler
  (üye e-postası + görev başlığı + dal/modül + içerik (link ise tıklanır) +
  `ReviewControls`: Onayla / Reddet(+geri bildirim)). Boşsa "Bekleyen gönderim yok".
- Nav'a admin "Onaylar" linki.

**Yeni client bileşenler (`web/src/components/tasks/`):** `SubmissionForm`, `ReviewControls`.
Admin görev CRUD için `TaskForm` (`web/src/components/admin/`) + mevcut `DeleteButton`.

## Veri akışı

```
Üye: /mufredat/gorevler/[moduleId] → getModuleTasks(moduleId, user.id)
  → SubmissionForm → submitTask(taskId, icerik, user.id) → revalidate

Admin: /admin/onaylar → getPendingSubmissions()
  → ReviewControls → reviewSubmission(id, 'onay'|'red', geri_bildirim, admin.id) → revalidate

Admin tanım: /admin/.../gorevler → createTask/updateTask/deleteTask
```

## Hata yönetimi

- `submitTask`: boş içerik → "İçerik boş olamaz."; RLS reddi → dostça.
- `reviewSubmission`: red'de geri_bildirim boşsa → "Reddederken not gir."; RLS admin.
- Tüm action'lar try/catch; UI banner/alert; sayfa çökmez.
- Self-approval: RLS engeller (üye durum'u 'onay' yapamaz).

## Test

**Vitest (saf):**
- `status.test.ts` — `canEditSubmission` (null→true, beklemede→true, red→true, onay→false);
  `submissionStatusLabel` (dört durum).

**Elle (dev sunucu + SQL editör, admin & üye):**
- Admin modüle görev ekle/düzenle/sil.
- Üye görev sayfasında link/metin gönder → "Beklemede"; düzenle; onaylanınca kilit.
- Admin onay kuyruğunda onayla/reddet+geri bildirim → üye durumu/geri bildirimi görür.
- Self-approval: üye doğrudan durum='onay' yapamaz (RLS reddi).
- Üye (admin değil) `/admin/onaylar` → `/panom`; başkasının gönderimini göremez.

## Kapsam dışı (sonraki spec'ler)

- Dosya/foto yükleme (Supabase Storage: bucket + RLS + boyut/tip).
- Puan entegrasyonu (onaylı görev → puan; dashboard + liderlik RPC).
- Son teslim tarihi, bildirim, gönderim geçmişi (çoklu deneme).
