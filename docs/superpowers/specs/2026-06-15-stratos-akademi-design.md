# Stratos Akademi — Tasarım Dokümanı (Spec)

**Tarih:** 2026-06-15
**Proje:** Stratos / TMT-İHA kulübü için video tabanlı eğitim platformu
**Durum:** Tasarım onaylandı — uygulama planı (writing-plans) bekliyor

---

## 1. Özet & Amaç

Kulüp üyelerini eğitmek için **video izle → quiz çöz → pratik görev yap** akışıyla
ilerleyen, w3schools tarzı bir öğrenme platformu. Her üyenin ilerlemesi, quiz başarıları
ve rozetleri takip edilir. YouTube playlistleriyle dağınık eğitim yerine yapılandırılmış,
ölçülebilir bir sistem hedefleniyor.

Mevcut `stratosiha.com` bir **tanıtım/portfolyo** sitesidir; bu platform ayrı bir
**eğitim uygulamasıdır** (önerilen adres: `ogren.stratosiha.com` veya `akademi.stratosiha.com`).

## 2. Hedefler & Başarı Ölçütleri

- Üyeler tek tıkla giriş yapıp kendilerine uygun daldan ilerleyebilmeli.
- Her ders bir kaliteli video + (modül sonunda) quiz + pratik görevden oluşmalı.
- Kaptan, kod yazmadan içerik ekleyip pratik görevleri onaylayabilmeli.
- Yönetici, her üyenin ilerleme/başarı durumunu görebilmeli.
- **Başarı ölçütü:** kulüp, kayıtlı üyelerin tamamlama oranını ve dal bazında
  ilerlemeyi tek ekrandan izleyebiliyor; yeni üye onboarding'i playlist paylaşmaktan
  yapılandırılmış müfredata taşınmış oluyor.

## 3. Kullanıcılar & Roller

| Rol | Yetkiler |
|-----|----------|
| **Üye** | Video izler, quiz çözer, pratik görev gönderir; kendi ilerlemesini, rozetlerini ve liderlik tablosunu görür. |
| **Kaptan / Admin** | Üye yetkilerine ek: dal/modül/ders/quiz ekle-düzenle-sil; pratik görev gönderilerini onayla/reddet (geri bildirimle); üye & rol yönetimi (e-posta izin listesi); tüm üyelerin ilerlemesini görüntüle. |

## 4. Teknik Yaklaşım

**Seçilen stack: Next.js + Supabase + Vercel** (tümü ücretsiz katmanda yeterli).

- **Next.js (App Router, TypeScript) + Tailwind CSS** — arayüz ve sayfa yönlendirme.
- **Supabase** — Postgres veritabanı, Google ile kimlik doğrulama (OAuth), dosya
  depolama (pratik görev fotoğraf/dosyaları), satır düzeyi güvenlik (RLS).
- **Vercel** — barındırma ve dağıtım.
- **Domain:** `stratosiha.com` alt alan adı.

**Gerekçe:** Tek dil (TypeScript/React), bakımı kulüp yazılımcılarının rahat yapabileceği
bir yapı ve "İHA Yazılım" müfredatıyla (React, Next.js, PostgreSQL) birebir örtüşen,
yani aynı zamanda yazılım dalı için **canlı örnek proje** olan bir teknoloji seti.

## 5. Müfredat Yapısı & Veri Modeli

Hiyerarşi: **Dal (Track) → Modül → Ders → (Quiz + Pratik Görev)**

Yapı: **Ortak temel + dallanma.** Herkes "Ortak Temel" dalını görür; sonra departmana
göre dallara ayrılır. Mevcut YouTube playlistleri bu yapıya birebir oturuyor:
- **TMT Drone** (52 video) → Ortak Temel (drone temelleri, Pixhawk, Betaflight, QGC) + referans görev videoları
- **İHA Elektronik** (32 video) → Elektronik dalı (temel elektronik, lehimleme, KiCad/PCB, uçuş kontrol kartı)
- **İHA Yazılım** (39 video) → Yazılım dalı (HTML/CSS/JS, React, Next.js, backend, SQL)
- Ek planlanan dallar: **Tasarım** (CAD/aerodinamik) ve **Pilot**.

### İlerleme mantığı: Karma (öneri + serbest)
Sistem sıralı **önerir** ve ilerlemeyi gösterir ama modülleri **kilitlemez**;
üye istediği sırada gidebilir.

### Veri modeli (kavramsal tablolar)

- **tracks** — `id, ad, açıklama, ikon, sıra`
- **modules** — `id, track_id, ad, açıklama, sıra`
- **lessons** — `id, module_id, başlık, youtube_video_id, notlar(markdown), süre, sıra`
- **quizzes** — `id, module_id, başlık, geçme_eşiği (vars. %70)`
- **questions** — `id, quiz_id, metin, tip(multiple_choice), seçenekler[], doğru_index, puan`
- **practical_tasks** — `id, module_id, açıklama, gönderim_tipi(foto|dosya|link|metin)`
- **profiles** — `id(auth), ad, rol(uye|admin), avatar, katılım_tarihi`
- **lesson_progress** — `user_id, lesson_id, izlendi(bool), izlendi_at`
- **quiz_attempts** — `user_id, quiz_id, puan, cevaplar, geçti(bool), tarih`
- **task_submissions** — `user_id, task_id, içerik(dosya_url/metin/link), durum(beklemede|onay|red), geri_bildirim, onaylayan, tarih`
- **badges** — `id, ad, açıklama, ikon, kazanma_kuralı`
- **user_badges** — `user_id, badge_id, kazanıldı_at`
- **allowlist** — `email, rol` (kimler kayıt olabilir)

### Quiz & Pratik Görev
- **Quiz:** çoktan seçmeli, otomatik puanlama, anında sonuç, tekrar deneme; geçme eşiği örn. %70.
- **Pratik görev:** üye foto/dosya/link/metin gönderir → durum "beklemede" → kaptan onaylar/reddeder + geri bildirim. Onaylanınca puan/rozet kazanılır.

### Puan & Oyunlaştırma (rozet + liderlik)
- **Puan:** quiz puanları + onaylı görevler + rozetlerden türetilir.
- **Rozetler:** modül bitirme, dal bitirme, ilk %100 quiz, günlük seri (streak) vb.
- **Liderlik tablosu:** tüm üyeler arası puan sıralaması; kullanıcının kendi satırı vurgulanır.

## 6. Sayfalar / Ekranlar

1. **Giriş** — Google ile (yalnız izin listesindeki e-postalar).
2. **Dashboard (Panom)** — "kaldığın yerden devam et" kartı, toplam ilerleme halkası, günlük seri, rozetler, dal ilerlemeleri, liderlik özeti.
3. **Müfredat** — sol tarafta dal→modül→ders ağacı (w3schools tarzı), önerilen sıra işaretli (✓ bitti / ● devam / ○ açılmadı).
4. **Ders sayfası** — gömülü YouTube videosu + ders notları + "İzledim/Sonraki ders"; modül sonunda Quiz ve Pratik Görev kartları.
5. **Quiz sayfası** — çoktan seçmeli, otomatik puan, sonuç + tekrar dene.
6. **Pratik görev gönderme** — foto/dosya/link/metin yükle → onay bekler.
7. **Profil / Başarılarım** — büyük profil başlığı, istatistikler, rozet ızgarası (kazanılan + kilitli), son aktiviteler, dal ilerlemesi.
8. **Liderlik tablosu** — tam sıralama.
9. **Admin paneli** — içerik CRUD, pratik görev onay kuyruğu, üye/rol yönetimi, tüm üye ilerlemesi.

## 7. Tasarım Sistemi

Onaylanan görsel yön (high-end / Awwwards-tier prensiplerle):

- **Fontlar:** başlık **Sora**, gövde **Plus Jakarta Sans** (Inter/Arial/Roboto yasak).
- **Renkler:** lacivert `#16243F`, altın `#C9A23A`, açık-altın `#F6ECCA`, açık zemin `#EEF1F6`,
  koyu zemin `#070D18`, koyu panel `#111C33`. (Marka logosundan türetildi.)
- **Bileşenler:** yüzen cam navigasyon (floating glass pill), "double-bezel" iç içe kartlar
  (dış kabuk + iç çekirdek, konsantrik radius), pill butonlar + buton-içinde-buton ok ikonu,
  eyebrow etiketler, konik-gradient ilerleme halkaları, bento/asimetrik grid, yumuşak diffüz gölgeler.
- **Çift tema:** açık (varsayılan) + koyu, ☀️/🌙 geçişi.
- **İkonlar:** ince çizgili set (Phosphor Light / Remix Line). (Mockup'larda emoji yer tutucu olarak kullanıldı.)
- **Responsive:** `768px` altında tek kolona düşer.
- **Mockup referansları:** `.superpowers/brainstorm/.../content/` altında `lesson-refined.html`,
  `dashboard.html`, `profile.html`, `dark-dashboard.html`.

## 8. Güvenlik

- Supabase **RLS**: üyeler içeriği okur, yalnız **kendi** ilerleme/gönderilerini yazar; adminler tam yetki.
- Kayıt **e-posta izin listesiyle** sınırlı (kulüp dışı giriş engellenir).
- Dosya yüklemeleri (pratik görev) boyut/tip kontrolüyle Supabase Storage'a.

## 9. Kapsam Dışı (YAGNI — v1 sadeliği)

Mobil uygulama (responsive web yeterli), canlı sohbet, PDF sertifika, e-posta bildirimi
(uygulama içi bildirim yeter), otomatik video-izlendi algılama (şimdilik "İzledim" butonu), ödeme.

## 10. Aşamalama

- **v1 (MVP):** Google giriş + izin listesi · dal/modül/ders · video sayfaları ·
  çoktan seçmeli quiz (otomatik) · kişisel ilerleme + dashboard · temel admin içerik CRUD.
  → Hızlı yayına alınıp içerik girilmeye başlanır.
- **v2:** pratik görev gönderme + onay akışı · rozetler · liderlik tablosu · profil aktivite akışı.

## 11. Açık Sorular / Sonraki Adımlar

- Alt alan adı netleştir: `ogren.` vs `akademi.stratosiha.com`.
- Modül/ders içeriğini ve quiz sorularını **yazmak** ayrı bir iş — iskelet hazır olunca
  playlistlerden modüller doldurulacak (gerekirse asistan yardımıyla).
- İlk dalların kesin modül listesi (özellikle Tasarım ve Pilot) içerik aşamasında belirlenecek.
- Git deposu başlatılmadı; sürüm kontrolü isteniyorsa `git init` ile başlatılabilir.
