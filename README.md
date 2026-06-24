# Stratos Akademi

Tofaş Fen Lisesi drone/İHA kulübü (Stratos / TMT-İHA, Bursa) için **video tabanlı
eğitim platformu** (w3schools tarzı LMS). Üyeler curated YouTube videolarını izler,
quiz çözer, pratik görev gönderir; ilerleme, streak, puan, yetkinlik ve liderlik takip
edilir. Kaptanlar içeriği ve üyeleri web panelinden yönetir.

## Teknoloji

- **Next.js 16** (App Router, RSC + Server Actions, TypeScript, `src/`, `@/*` alias)
- **Tailwind CSS v3** — lacivert `#16243F` + altın `#C9A23A`; Sora (başlık) + Plus Jakarta Sans (gövde); açık/koyu tema
- **Supabase** — Postgres + Auth (Google OAuth) + RLS + Storage
- **Vitest** + Testing Library
- Dağıtım: Vercel

## Özellikler

- **Giriş:** Google OAuth, e-posta izin listesi (`allowlist`) ile sınırlı; `uye`/`admin` rolleri.
- **Müfredat:** Dal → Modül → Ders hiyerarşisi; YouTube IFrame ile izleme; anti-skip tamamlama (konum ≥%90 **ve** gerçekten izlenen ≥%20). **Arama:** `/mufredat`'ta ders/modül/dal adına göre canlı süzme (Türkçe duyarlı; hiyerarşi korunur).
- **Quiz:** Modül sonu çoktan/çok-doğru seçmeli; sunucu tarafı puanlama; cevaplar yalnız submit sonrası (anti-cheat).
- **Dashboard (`/panom`):** kaldığın yer, ilerleme halkası, dal kartları, günlük seri (streak), puan, mini liderlik, dal yetkinlikleri.
- **Liderlik (`/liderlik`):** güvenli `SECURITY DEFINER` RPC; "Ad S." formatı; zaman aralığı sekmeleri (tüm zamanlar / son 30 gün / son 7 gün).
- **Profil (`/profil`):** üyenin kendi puan/streak/ilerleme/onaylı görev özeti + yetkinlik vitrini + rozetler.
- **Rozetler (achievements):** mevcut verilerden **türetilen** 15 rozet (ders/görev/yetkinlik/puan = herkese açık; seri/quiz = yalnız kendi profili). Migration yok; saf fonksiyon (`lib/badges`). `/profil` (tam + sıradaki ipucu), `/panom` (vitrin), `/uye/[id]` (public alt küme).
- **Pratik görev:** modül başına görev; üye link/metin **ve/veya** dosya (foto/PDF, Supabase Storage) gönderir; kaptan onaylar/reddeder + geri bildirim; onaylı görev puana katkı verir.
- **Bildirimler:** görev onay/red → üyeye in-app bildirim; Nav'da okunmamış sayacı.
- **Admin paneli:** müfredat CRUD, quiz CRUD, üye/izin listesi yönetimi (davet/rol/silme), görev tanımı CRUD, onay kuyruğu.

**Puan formülü:** `tamamlanan ders × 20 + Σ(quiz en iyi %) + Σ(onaylı görev puanı)`.
**Streak:** ders/quiz aktivitesi olan peş peşe günler (Türkiye saati, 1 gün tolerans).

## Kurulum (yerel)

```bash
cd web
npm install
# web/.env.local oluştur (aşağıya bak)
npm run dev   # http://localhost:3000
```

### Ortam değişkenleri (`web/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://<proje-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # YALNIZ sunucu; asla NEXT_PUBLIC_ değil, asla commit'lenmez
# E-posta bildirimleri (opsiyonel — yoksa e-posta sessizce atlanır):
NEXT_PUBLIC_SITE_URL=https://stratosiha.com           # e-posta linkleri için mutlak adres
RESEND_API_KEY=<resend-key>                           # https://resend.com → API Keys
MAIL_FROM=Stratos Akademi <bildirim@alanadi.com>      # Resend'de doğrulanmış gönderen
```

### E-posta kurulumu (Resend)
1. [resend.com](https://resend.com)'da hesap aç, bir API key oluştur → `RESEND_API_KEY`.
2. Bir gönderen domaini doğrula (DNS kayıtları) ve `MAIL_FROM`'u o domaine ayarla.
3. `NEXT_PUBLIC_SITE_URL`'i prod adresine ayarla (e-posta içindeki "Görevi gör" linki için).
4. Bu üç değişken yoksa kaptan görev onay/red'inde e-posta gönderilmez; uygulama normal çalışır (yalnız in-app bildirim).
`.env.local` gitignore'da. Service role anahtarı yalnız server action'larda (quiz puanlama, imzalı URL, üye silme, eski dosya temizliği) kullanılır.

## Veritabanı (Supabase)

Migration'lar `supabase/migrations/` altında **sıralı numaralı**. Bu projede
migration'lar **Supabase SQL editöründe elle** çalıştırılır (postgres rolü; SECURITY
DEFINER fonksiyonları ve storage politikaları için gerekli). Sırayla 0001 → 0016
uygulanmalı:

| # | Dosya | Ne |
|---|---|---|
| 0001 | foundation | profiles + allowlist + RLS + yeni-kullanıcı trigger |
| 0002 | curriculum | tracks/modules/lessons + lesson_progress |
| 0003 | seed_curriculum | başlangıç müfredat verisi |
| 0004 | quiz | quizzes/questions/question_options/quiz_attempts (dogru kolonu üyeye kapalı) |
| 0005 | seed_quiz | başlangıç quiz verisi |
| 0006 | grant_service_role_quiz | service_role quiz SELECT grant |
| 0007 | quiz_attempts_default_user | quiz_attempts.user_id default auth.uid() |
| 0008 | leaderboard_rpc | leaderboard() SECURITY DEFINER ($func$) |
| 0009 | user_competencies | dal yetkinlikleri |
| 0010 | admin_curriculum_rls | is_admin() + müfredat admin yazma RLS |
| 0011 | admin_quiz_rls | quiz admin yazma RLS |
| 0012 | admin_members_rls | allowlist admin yazma + profiles admin update |
| 0013 | practical_tasks | practical_tasks + task_submissions + RLS (self-approval engeli) |
| 0014 | task_points | practical_tasks.puan + leaderboard'a görev puanı |
| 0015 | gorev_dosya | gorev-dosyalari bucket + dosya_yolu + storage RLS |
| 0016 | notifications | notifications tablosu + RLS |
| 0017 | leaderboard_ranged | zaman aralıklı liderlik RPC (tüm/30g/7g) |
| 0018 | member_profile | üye profil özeti RPC (toplu, e-postasız) |
| 0019 | question_explanation | soru açıklaması + questions kolon-bazlı select kısıtı |
| 0020 | user_badges | kazanılan rozet kalıcılığı (yeni-rozet toast'u; rozetler türetilmiş, tablo yalnız "yeni" tespiti için — yoksa graceful) |
| 0021 | guard_profile_role | **GÜVENLİK:** üyenin kendini admin yapmasını engelleyen BEFORE UPDATE trigger (role değişimi yalnız admin/service_role/postgres). **ÖNEMLİ: en kısa sürede uygula.** |
| 0022 | quiz_attempts_server_only | **GÜVENLİK:** üye doğrudan REST'e `{quiz_id,puan:100}` atıp liderlik puanı şişiremesin diye `quiz_attempts` INSERT'i authenticated'tan alınır; puanlama yalnız service_role. `my_uid()` RPC (getUser'sız doğrulanmış user_id). Kod 0022 öncesi/sonrası uyumlu; **en kısa sürede uygula.** |

> **Not (gemiyi yüzdürürken kritik):** SECURITY DEFINER fonksiyonlarını SQL editöre
> yazarken `$$` yerine adlandırılmış sınırlayıcı (`$func$`) kullan — `$$` bazen
> "42P13: no language specified" verir.

### Bir hesabı admin yapma
Kullanıcı önce Google ile giriş yapıp profil oluşturmalı, sonra:
```sql
update public.profiles set role = 'admin' where email = 'kaptan@okul.edu.tr';
-- (allowlist.role yalnız kayıt anı içindir; mevcut üye için profiles.role esastır)
```
Yeni üye davet etmek: admin `/admin/uyeler` sayfasından e-posta ekler (veya
`insert into public.allowlist (email, role) values ('uye@...', 'uye');`).

## Komutlar

```bash
cd web
npm run dev        # geliştirme
npm run test       # vitest (saf hesap fonksiyonları: puan, streak, yetkinlik, slug, vb.)
npm run build      # production derleme
npx tsc --noEmit   # tip kontrolü
```

## Dağıtım (Vercel)

1. Repo'yu Vercel'e bağla; **Root Directory = `web`**.
2. Ortam değişkenlerini (üç anahtar) Vercel proje ayarlarına ekle.
3. Supabase Auth → Google OAuth redirect URL'lerine prod adresini ekle.
4. `main`'e push → otomatik deploy. **Migration'ları deploy'dan önce/ile birlikte
   Supabase'de çalıştır** (kod yeni şemaya dayanıyorsa).

## Mimari notlar

- **Yetki yükseltme koruması (0021):** `profiles` self-update politikası WITH CHECK
  içermediğinden tek başına `role` kolonunu korumaz; `guard_profile_role` trigger'ı
  `authenticated` rolünün (web üyesi) kendi rolünü değiştirmesini engeller, yalnız
  admin/`service_role`/`postgres` rol değiştirebilir. Yeni şema kurulurken 0021 atlanmamalı.
- **RLS her yerde:** içerik okuması authenticated; yazma `is_admin()` ile admin'e açık.
  Quiz `dogru` kolonu üyeye kapalı (kolon-grant); admin/puanlama service_role ile okur.
  Pratik görev gönderiminde "self-approval" RLS WITH CHECK ile engellenir (üye durumu
  yalnız `beklemede` yapabilir).
- **Auth dersleri:** proxy (`src/proxy.ts`) kanonik Supabase `setAll` kalıbı kullanır;
  `getClaims()` bu projede girişi bozar → `getUser()`; server action'larda `getUser()`
  çağrılmaz (refresh-token rotasyon yarışı) — `user_id` parametre + RLS ile doğrulanır.
- **Tasarım/plan dokümanları:** `docs/superpowers/{specs,plans}/` altında her feature
  için spec + uygulama planı.

## Lisans / kapsam

Kulüp içi eğitim aracı. İçerik (videolar) üçüncü taraf; platform kodu kulübe aittir.
