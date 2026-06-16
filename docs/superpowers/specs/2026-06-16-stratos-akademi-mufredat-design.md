# Stratos Akademi — Müfredat + Ders + İlerleme (Tasarım / Spec)

**Tarih:** 2026-06-16
**Durum:** Tasarım onaylandı — uygulama planı (writing-plans) bekliyor
**Önceki:** v1 Temel (`docs/superpowers/plans/2026-06-15-stratos-akademi-foundation.md`) — canlı çalışıyor (giriş, tema, tasarım sistemi, Supabase, proxy auth).

---

## 1. Amaç & Kapsam

Üyelerin **dal → modül → ders** hiyerarşisinde gezinip videoları izleyebildiği, ilerlemenin
**otomatik** kaydedildiği müfredat deneyimi. Bu alt-proje quiz/pratik görev ve tam dashboard'u
**içermez** (onlar sonraki planlar). Çıktı: dolu (seed'li), gezilebilir, ilerleme kaydeden bir müfredat.

**Başarı ölçütü:** Giriş yapan üye `/mufredat`'ta dalları/modülleri/dersleri görür; bir dersi
açıp izler; video ~%90'a geldiğinde ders otomatik ✓ olur; müfredat ağacında ve "kaldığın yerden
devam et"te ilerleme yansır.

## 2. Veri Modeli (yeni tablolar)

- **tracks** — `id uuid pk`, `slug text unique`, `ad text`, `aciklama text`, `ikon text`, `sira int`
- **modules** — `id uuid pk`, `track_id fk→tracks`, `ad text`, `aciklama text`, `sira int`
- **lessons** — `id uuid pk`, `module_id fk→modules`, `baslik text`, `youtube_video_id text`,
  `aciklama text` (düz metin), `sure_sn int null`, `sira int`
- **lesson_progress** — `user_id fk→auth.users`, `lesson_id fk→lessons`, `completed bool default false`,
  `completed_at timestamptz null`, `updated_at timestamptz default now()`, **PK (user_id, lesson_id)**

İndeksler: `modules(track_id, sira)`, `lessons(module_id, sira)`, `lesson_progress(user_id)`.

### Güvenlik (RLS + GRANT — baştan doğru)
- `tracks/modules/lessons`: giriş yapan herkes **okur**.
  `grant select ... to authenticated;` + RLS select policy `auth.role() = 'authenticated'`.
- `lesson_progress`: kullanıcı **yalnız kendi** satırını okur/yazar (`auth.uid() = user_id`).
  `grant select, insert, update ... to authenticated;` + RLS select/insert/update policy `user_id = auth.uid()`.

## 3. Otomatik İlerleme Akışı

- **Yaklaşım A (seçilen):** YouTube **IFrame Player API** + Next **server action**.
- İstemci `LessonPlayer` bileşeni: IFrame Player API'sini yükler, oynatıcıyı `youtube_video_id` ile
  kurar, periyodik (`~5 sn`) `getCurrentTime()/getDuration()` ile oranı hesaplar.
- Oran **≥ 0.9** olunca `markLessonComplete(lessonId)` server action'ı çağrılır → `lesson_progress`
  **upsert** (`completed=true, completed_at=now()`). İdempotent: zaten tamamlıysa tekrar yazmaz.
- **Manuel yedek:** "İzledim" butonu aynı action'ı çağırır (API olayları kaçarsa).
- Eşik mantığı (`isComplete(current, duration) => current/duration >= 0.9`) **saf fonksiyon**, ayrı test edilir.

## 4. Sayfalar

- **/mufredat** — sol ağaç (onaylanan `lesson-refined` düzeni): dal → modül → ders;
  durum rozetleri **✓ tamamlandı / ● devam ediyor (bir sonraki yapılacak) / ○ başlanmadı**.
  Ders tıklanınca ders sayfasına gider. Sunucuda `tracks+modules+lessons` ve kullanıcının
  `lesson_progress`'i çekilir, ağaç durumları hesaplanır.
- **/mufredat/[lessonId]** — `LessonPlayer` (YouTube) + düz metin açıklama + otomatik/manuel
  tamamlama + "Sonraki ders →" (modül/dal sırasına göre). Üst kısım `AppShell` içinde.
- **/panom (güncelleme)** — yer-tutucu metin yerine **"Kaldığın yerden devam et"**: kullanıcının
  en son `updated_at`'li **tamamlanmamış** dersi (yoksa ilk başlanmamış ders) + genel ilerleme yüzdesi
  (tamamlanan ders / toplam ders). *(Tam dashboard kartları kendi planında.)*

## 5. Başlangıç Tohumu (seed migration — playlistlerden curated)

5 dal satırı: **Ortak Temel, Elektronik, Yazılım, Tasarım, Pilot**. İçerik tohumlanan
(YouTube video kimlikleri seed sırasında doldurulur):

- **Ortak Temel**
  - *Modül: Drone Temelleri* — "Drones | How do they work?", "Drone Theory 101: Part 1", "(DIY Drone Basics) Parts of DIY Drones"
  - *Modül: Uçuş Kontrol & Kurulum* — "PixHawk (1/5) initial setup", "PixHawk (2/5) first hover", "Intro to Flight with QGroundControl", "Betaflight TR Bölüm 1", "Betaflight TR Bölüm 2"
- **Elektronik**
  - *Modül: Temel Elektronik* — "20 Dakikada Temel Elektronik", "Voltage/Current/Resistance", "What is AC and DC?", "Multimetre Kullanımı"
  - *Modül: Lehimleme* — "HOW TO SOLDER! (Beginner's Guide)", "10 STUPID ERRORS in Soldering"
  - *Modül: PCB Tasarımı (KiCad)* — "KiCad Ders 1..6"
- **Yazılım**
  - *Modül: Web Temelleri* — "HTML Tutorial", "CSS Tutorial", "JavaScript Programming - Full Course"
  - *Modül: Modern Web* — "Learn React 18", "Next.js Framework Course"
- **Tasarım**, **Pilot** — şimdilik içeriksiz (dal satırı var, modül/ders sonra admin ile).

Not: video kimlikleri, playlist çıkarımındaki gerçek videolardan plan aşamasında netleştirilir.

## 6. Kapsam Dışı (YAGNI) & Sonraki Planlar

Quiz & pratik görev (sonraki plan) · tam dashboard kartları/rozet/liderlik (sonraki plan) ·
admin paneli (sonraki plan) · videoda saniye-konumu/resume (yalnız `completed` boolean tutulur) ·
çoklu dil/altyazı yönetimi.

## 7. Test (TDD)

- `isComplete(current, duration)` saf fonksiyon (≥%90, 0/null koruması).
- `markLessonComplete` server action (yeni tamamlamada upsert; tekrar çağrıda idempotent) — entegrasyon testi (Supabase mock veya yerel).
- Müfredat ağacı durum hesabı (`✓/●/○`) saf fonksiyon + bileşen testi.
- Mevcut 9 testi kırmadan ilerlemek; RLS/GRANT migration'ı uygulanabilir olmalı.

## 8. Dosya Yapısı (özet)
```
supabase/migrations/0002_curriculum.sql          # tracks/modules/lessons/lesson_progress + RLS + GRANT
supabase/migrations/0003_seed_curriculum.sql     # curated başlangıç tohumu
web/src/lib/curriculum/progress.ts               # isComplete + ağaç durum saf fonksiyonları
web/src/lib/curriculum/queries.ts                # tracks+modules+lessons+progress çekme
web/src/app/mufredat/page.tsx                    # müfredat ağacı
web/src/app/mufredat/[lessonId]/page.tsx         # ders sayfası
web/src/components/curriculum/LessonPlayer.tsx   # YouTube IFrame API + ilerleme
web/src/app/actions/lessons.ts                   # markLessonComplete server action
web/src/app/panom/page.tsx                       # "kaldığın yerden devam et" güncellemesi
```
