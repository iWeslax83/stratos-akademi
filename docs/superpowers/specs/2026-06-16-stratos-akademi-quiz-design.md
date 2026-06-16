# Stratos Akademi — Quiz (Tasarım / Spec)

**Tarih:** 2026-06-16
**Durum:** Tasarım onaylandı — uygulama planı (writing-plans) bekliyor
**Önceki:** v1 Temel + Müfredat (`main`'de canlı). Bu alt-proje modül sonu quizlerini ekler.

---

## 1. Amaç & Kapsam

Her modülün sonunda **çoktan seçmeli (çok-doğru destekli)** bir quiz. Üye çözer, **otomatik puanlanır**,
sonuç + doğru cevaplar gönderimden sonra gösterilir, **sınırsız tekrar** denenebilir. İlerlemeyi
**engellemez** — sadece kaydedilir/gösterilir. Kapsam: quiz çözme + puanlama + sonuç. Pratik görev,
tam dashboard, admin paneli bu planda yok.

**Başarı ölçütü:** Üye bir modülün quizine girer, soruları işaretler, gönderir; anında puanını,
hangi soruları yanlış yaptığını ve doğru cevapları görür; tekrar deneyebilir; en iyi puanı saklanır.

## 2. Veri Modeli (migration 0004)

- **quizzes** — `id uuid pk`, `module_id uuid unique references modules`, `baslik text`, `gecme_esigi int default 70`, `sira int`
- **questions** — `id uuid pk`, `quiz_id uuid references quizzes`, `metin text`, `sira int`
- **question_options** — `id uuid pk`, `question_id uuid references questions`, `metin text`, `dogru boolean default false`, `sira int`
- **quiz_attempts** — `id uuid pk`, `user_id uuid references auth.users`, `quiz_id uuid references quizzes`, `puan int`, `gecti boolean`, `created_at timestamptz default now()`

İndeks: `questions(quiz_id, sira)`, `question_options(question_id, sira)`, `quiz_attempts(user_id, quiz_id)`.

## 3. Güvenlik (cevaplar gönderimden önce gizli)

- `quizzes`, `questions`: `grant select to authenticated` + RLS select `auth.role()='authenticated'`.
- `question_options`: **column-level grant** — `grant select (id, question_id, metin, sira) to authenticated`
  (yani **`dogru` sütunu istemciye kapalı**) + RLS select `authenticated`.
- `quiz_attempts`: kullanıcı yalnız kendi satırını okur/yazar (`auth.uid()=user_id`) + grant select,insert.
- **Puanlama** Next server action'ında **service-role** Supabase istemcisiyle yapılır (RLS/grant bypass →
  `dogru`'yu okuyabilir). Servis anahtarı `SUPABASE_SERVICE_ROLE_KEY` olarak `.env.local`'de (server-only,
  `NEXT_PUBLIC_` değil, gitignored). Attempt insert'i kullanıcının normal oturumuyla yapılır (RLS: kendi satırı).

## 4. Puanlama (saf TS fonksiyonu — TDD)

`scoreQuiz(questions, answers)`:
- Her soru için **seçilen şık kümesi == doğru şık kümesi (birebir)** ise doğru; eksik/fazla seçim yanlış.
- `puan = round(dogruSoru / toplamSoru * 100)`; `gecti = puan >= gecme_esigi`.
- Boş quiz (0 soru) → puan 0.
Çıktı: `{ puan, gecti, perQuestion: [{ questionId, dogruMu }] }` + doğru şık kimlikleri (sonuç ekranı için).

## 5. Akış & Sayfalar

- **/mufredat/quiz/[quizId]** — soruları checkbox'larla (çok seçim) gösterir → **Gönder** → server action
  service-role ile puanlar, `quiz_attempts`'e yazar, sonuç döner → **puan + her sorunun doğru/yanlışı +
  doğru cevaplar vurgulu** + **Tekrar dene**. En iyi önceki puan üstte gösterilir.
- **Ders sayfası** (`/mufredat/[lessonId]`): bulunduğu modülün quizi varsa **"📝 Modül Quizi"** kartı
  (en iyi puan / ✓ geçti rozeti) → quiz sayfasına link. (Onaylı `lesson-refined` mockup'ındaki kart.)
- **Müfredat ağacı**: modül başlığında quiz geçildiyse küçük ✓ işareti (opsiyonel, sade).

Veri: `getCurriculum` modüllere hafif `quiz` alanı (`id, baslik`) ekler (ek sorgu). En iyi puan
`quiz_attempts`'ten `max(puan)` ile çekilir.

## 6. Başlangıç Tohumu (migration 0005)

Örnek quizler (çok-doğru sorular, doğru şık işaretli) — plan aşamasında sorular yazılır:
- **Ortak Temel → Drone Temelleri** modülü: 3-4 soru (drone temel kavramları).
- **Elektronik → Temel Elektronik** modülü: 3-4 soru (gerilim/akım/AC-DC).
Gerisi admin panelinden (sonraki plan).

## 7. Kapsam Dışı (YAGNI) & Test

Süreli quiz, soru/şık karıştırma, soru başına açıklama, modül başına >1 quiz → yok.
TDD: `scoreQuiz` (birebir küme eşleşmesi; çok-doğru; eksik/fazla seçim; boş quiz) + quiz sayfası
bileşen testi (şık seç → gönder → sonuç render). Mevcut testler kırılmamalı; build yeşil.

## 8. Dosya Yapısı (özet)
```
supabase/migrations/0004_quiz.sql                # quizzes/questions/question_options/quiz_attempts + RLS + (column) GRANT
supabase/migrations/0005_seed_quiz.sql           # örnek quizler
web/src/lib/quiz/types.ts                         # QuizQuestion/QuizOption/QuizResult tipleri
web/src/lib/quiz/score.ts                         # scoreQuiz saf fonksiyon
web/src/lib/quiz/queries.ts                       # getQuiz (şıklar dogru'suz), getBestScore
web/src/lib/supabase/service.ts                   # service-role client (server-only)
web/src/app/actions/quiz.ts                       # submitQuiz server action (service-role puanlama)
web/src/components/quiz/QuizRunner.tsx            # istemci: sorular, seçim, gönder, sonuç
web/src/app/mufredat/quiz/[quizId]/page.tsx       # quiz sayfası
web/src/components/curriculum/ModuleQuizCard.tsx  # ders sayfasındaki quiz kartı
(düzenlenecek) web/src/lib/curriculum/queries.ts  # modüle hafif quiz alanı
(düzenlenecek) web/src/app/mufredat/[lessonId]/page.tsx  # quiz kartını göster
```
