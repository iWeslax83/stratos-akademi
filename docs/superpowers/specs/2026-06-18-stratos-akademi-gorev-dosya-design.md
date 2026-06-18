# Stratos Akademi — Pratik Görev Dosya Yükleme Tasarımı

**Tarih:** 2026-06-18
**Durum:** Onaylandı (otonom — bkz user-feedback-otonom-mod)
**Önceki:** Pratik görev v1 + puan entegrasyonu — `main`'de

## Amaç

Üyelerin pratik göreve link/metin yanında **foto/dosya** (görsel/PDF) yükleyebilmesi;
kaptanın onay kuyruğunda dosyayı imzalı URL ile görüp inceleyebilmesi.

## Kararlar (otonom)

- Supabase **Storage bucket** `gorev-dosyalari` — **private**, 5MB limit, izinli tipler
  JPG/PNG/WEBP/PDF.
- `task_submissions`'e `dosya_yolu text null` (storage path).
- Gönderim: **link/metin VEYA dosya** (en az biri). İkisi birlikte de olabilir.
- Dosya tarayıcıdan (browser supabase client) `${userId}/${taskId}/${stamp}-${ad}` yoluna
  yüklenir. RLS: üye yalnız kendi klasörüne yazar.
- Görüntüleme **imzalı URL** ile, sunucuda **service_role** üretir (üye kendi dosyası +
  admin tüm dosyalar). Bucket private kalır.
- Eski dosya temizliği (yeniden yüklemede) v1'de YOK (yetim dosya kabul) — sonraki.

## Mimari

### Migration `0015_gorev_dosya.sql`
```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gorev-dosyalari', 'gorev-dosyalari', false, 5242880,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

alter table public.task_submissions add column if not exists dosya_yolu text;

-- storage.objects RLS (storage'da RLS zaten açık)
create policy "gorev dosya yükle" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'gorev-dosyalari' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "gorev dosya okunur (kendi veya admin)" on storage.objects
  for select to authenticated
  using (bucket_id = 'gorev-dosyalari'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "gorev dosya kendi günceller" on storage.objects
  for update to authenticated
  using (bucket_id = 'gorev-dosyalari' and (storage.foldername(name))[1] = auth.uid()::text);
```
Not: SQL editor postgres rolüyle çalıştığından storage.objects politikaları oluşturulabilir.
İmzalı URL'ler service_role ile üretildiğinden okuma RLS'i şart değil ama tutarlılık + ileride
istemci önizleme için eklendi.

### Saf yardımcılar (`web/src/lib/tasks/upload.ts`)
```ts
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export function validateFile(file: { type: string; size: number }): string | null; // hata|null
export function uploadPath(userId: string, taskId: string, fileName: string, stamp: number): string;
// `${userId}/${taskId}/${stamp}-${sanitize(fileName)}`  (sanitize: [^a-zA-Z0-9._-]→_)
```

### İmzalı URL (sunucu) `web/src/lib/tasks/signed.ts`
```ts
export async function signedUrlMap(paths: string[]): Promise<Map<string, string>>;
// service_role ile bucket'tan createSignedUrls(paths, 3600); path→url map (boş path'ler atlanır)
```

### queries (`web/src/lib/tasks/queries.ts` — değişir)
- `Submission` tipine `dosya_yolu: string | null`; `getModuleTasks` select'e `dosya_yolu`.
- `PendingSubmission` tipine `dosya_yolu: string | null`; `getPendingSubmissions` select'e
  `dosya_yolu` (nested select'e dokunmadan, üst düzey kolon).

### actions (`web/src/app/actions/tasks.ts` — değişir)
- `submitTask(taskId, icerik, userId, dosyaYolu: string | null)` — doğrulama: `icerik` boş VE
  `dosyaYolu` yoksa → "Link/metin veya dosya gerekli.". upsert'e `dosya_yolu: dosyaYolu` eklenir.

### UI
- `SubmissionForm` (client, değişir): mevcut textarea + **dosya input** (opsiyonel). Submit'te:
  dosya seçiliyse `validateFile` → hata|devam; tarayıcı supabase client ile `uploadPath`'e
  yükle (`upsert:false`); başarılıysa path'i `submitTask`'a geçir. Dosya yoksa mevcut
  `submission.dosya_yolu`'nu korur. Mevcut dosya varsa imzalı URL ile "Yüklenen dosya" linki
  (prop `dosyaUrl`).
- `mufredat/gorevler/[moduleId]` (değişir): submission'ların `dosya_yolu`'ları için
  `signedUrlMap` üret, forma `dosyaUrl` geç.
- `admin/onaylar` (değişir): pending'lerin `dosya_yolu`'ları için `signedUrlMap`; varsa
  "Dosya →" linki göster (içerik linki/metni ile birlikte).

## Veri akışı

```
Üye gönderim: dosya seç → validateFile → browser upload (uploadPath) → submitTask(..., path)
Görüntüleme: server signedUrlMap(paths) → imzalı URL → <a> link
```

## Hata yönetimi
- `validateFile`: tip/boyut hatası net mesaj (yükleme öncesi).
- Yükleme hatası (storage RLS/ağ) → form banner, gönderim yapılmaz.
- `submitTask`: link/metin VE dosya yoksa hata.
- İmzalı URL üretilemezse link gösterilmez (sayfa çökmez).

## Test
**Vitest:** `upload.test.ts` — `validateFile` (geçerli tipler, yanlış tip, büyük boyut);
`uploadPath` (yapı + sanitization). **Elle:** üye foto/PDF yükler → onay kuyruğunda dosya linki
açılır; yanlış tip/boyut reddedilir; bucket private (imzasız erişilemez).

## Kapsam dışı
Eski dosya temizliği; çoklu dosya; sürükle-bırak; görsel önizleme thumbnail.
