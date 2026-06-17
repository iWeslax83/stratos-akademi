# Stratos Akademi — Admin: Quiz CRUD Tasarımı

**Tarih:** 2026-06-17
**Durum:** Onaylandı
**Önceki:** Foundation, Müfredat, Quiz, Dashboard, Admin Müfredat CRUD (hepsi `main`'de)

## Amaç

Adminlerin bir modülün quiz'ini (sorular + şıklar + doğru cevaplar) web
arayüzünden yönetmesi. Admin panelinin ikinci parçası; üye/izin listesi yönetimi
sonraki spec.

## Kapsam ve karar özeti

- Modül altında **tek sayfa iç içe quiz editörü** (`/admin/mufredat/[trackId]/[moduleId]/quiz`).
- **Granular kaydetme:** her öğe kendi server action'ı; client her aksiyon sonrası
  `router.refresh()` ile tazeler (revalidatePath gerekmez).
- Quiz modülle **1:1** (`quizzes.module_id` unique).
- **Doğru cevap okuma service_role ile** (sunucu tarafı), authenticated kolon-grant'i
  `dogru`'yu hariç tuttuğu için.
- Çok-doğru destekli (puanlama zaten tam-küme eşleşmesi). Doğru şık seçilmemişse
  **engelleme yok**, yalnız sade uyarı metni.

## Mevcut durum (bulgular)

Şema (migration 0004):
- `quizzes(id, module_id unique, baslik, gecme_esigi default 70, sira)`
- `questions(id, quiz_id, metin, sira)`
- `question_options(id, question_id, metin, dogru, sira)`
- Hepsi `on delete cascade` (modül silinince quiz, quiz silinince sorular, soru
  silinince şıklar gider).

RLS/grant:
- `quizzes`/`questions`: SELECT authenticated (tablo grant).
- `question_options`: SELECT **yalnız `(id, question_id, metin, sira)`** authenticated
  (kolon grant) — `dogru` üyelere KAPALI.
- service_role: üç tabloda da SELECT (submitQuiz için).
- `is_admin()` SECURITY DEFINER helper 0010'da mevcut; quiz tablolarında **yazma
  politikası YOK** → bu spec ekleyecek.

## Mimari

### Yetki & güvenlik (migration `0011_admin_quiz_rls.sql`)
```sql
create policy "quizzes admin yazar" on public.quizzes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "questions admin yazar" on public.questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "options admin yazar" on public.question_options
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant insert, update, delete on public.quizzes to authenticated;
grant insert, update, delete on public.questions to authenticated;
grant insert, update, delete on public.question_options to authenticated;
```
Notlar:
- Tablo düzeyi insert/update/delete grant'i `dogru` kolonunu da kapsar; yazma
  yalnız `is_admin()` true ise geçer (RLS). Üyeler hâlâ yazamaz.
- `dogru` SELECT'i hâlâ üyelere kapalı (kolon grant'i değişmiyor); admin editörü
  `dogru`'yu service_role ile okur (aşağıda).
- Mevcut "okunur" SELECT politikaları durur; OR'lanır, üye okuması bozulmaz.

### Veri okuma

`web/src/lib/admin/quiz-queries.ts`:
```ts
export type AdminOption = { id: string; metin: string; dogru: boolean; sira: number };
export type AdminQuestion = { id: string; metin: string; sira: number; options: AdminOption[] };
export type AdminQuiz = { id: string; baslik: string; gecme_esigi: number; questions: AdminQuestion[] };

export async function getQuizForAdmin(moduleId: string): Promise<AdminQuiz | null>;
```
- `createServiceClient()` (server-only) ile o modülün quiz'ini okur; quiz yoksa `null`.
- quiz → questions (sira'ya göre) → question_options (`dogru` DAHİL, sira'ya göre).
- Yalnız admin guard'lı sayfadan çağrılır; veri (doğru cevaplar dahil) yalnız admine gider.

### Server actions (`web/src/app/actions/admin-quiz.ts`, "use server")

Hepsi `Promise<{ ok: boolean; error?: string }>` döner, try/catch, `errMsg` ile
RLS hatasını dostça çevirir (admin-curriculum.ts'teki ile aynı kalıp). `revalidatePath`
KULLANMAZ — client `router.refresh()` yapar.

- `createQuiz(moduleId: string)` — modüle quiz oluşturur (baslik "Modül Quizi",
  gecme_esigi 70). module_id unique olduğu için ikinci kez başarısız olursa dostça hata.
- `updateQuizMeta(fd: FormData)` — [id, baslik (zorunlu), gecme_esigi (0–100, sayı)].
- `deleteQuiz(quizId: string)`
- `createQuestion(quizId: string)` — boş metinli yeni soru ekler (metin sonra düzenlenir).
- `updateQuestion(fd: FormData)` — [id, metin (zorunlu), sira].
- `deleteQuestion(id: string)`
- `createOption(questionId: string)` — boş metinli yeni şık ekler (dogru=false).
- `updateOption(fd: FormData)` — [id, metin (zorunlu), sira].
- `toggleOption(id: string, dogru: boolean)` — `dogru`'yu set eder.
- `deleteOption(id: string)`

### UI

**Modül sayfası** (`web/src/app/admin/mufredat/[trackId]/[moduleId]/page.tsx`, mevcut):
üstte "Modül Quizi" bölümü + `/admin/mufredat/[trackId]/[moduleId]/quiz`'e
"Quiz'i düzenle" linki.

**Quiz editörü** (`web/src/app/admin/mufredat/[trackId]/[moduleId]/quiz/page.tsx`,
server, service_role okur, admin guard layout'u altında):
- Breadcrumb: Müfredat / dal / modül / Quiz.
- Quiz yoksa: "Bu modülün quizi yok." + **Quiz oluştur** (`ActionButton` → createQuiz).
- Quiz varsa:
  - `QuizMetaForm` (başlık, geçme eşiği, Kaydet).
  - Sorular: her biri `QuestionEditor` — soru metni (Kaydet/Sil) + şıkları
    (`OptionRow`: metin Kaydet + **doğru** kutusu (toggleOption) + Sil) + **şık ekle**.
    Soruda doğru şık yoksa sade uyarı: "doğru şık seçilmedi" (muted, engelleme yok).
  - **Soru ekle** (`ActionButton` → createQuestion).
  - **Quizi sil** (`DeleteButton`, cascade uyarısı: "Tüm sorular ve şıklar silinecek").

**Yeni bileşenler (`web/src/components/admin/`):**
- `QuizMetaForm.tsx` (client) — onSubmit → updateQuizMeta → router.refresh.
- `QuestionEditor.tsx` (client) — soru metni formu + şıkları (OptionRow) render eder
  + şık ekle. createOption/updateQuestion/deleteQuestion çağırır.
- `OptionRow.tsx` (client) — şık metni formu + doğru checkbox (toggleOption) + sil.
- `ActionButton.tsx` (client) — etiket + bağlı (bound) action + `router.refresh()`;
  onaysız (ekleme/oluşturma için). Silmeler mevcut `DeleteButton` (onaylı) ile.

Mevcut `Card`, `Button`, `Eyebrow`, `AdminBreadcrumb`, `DeleteButton`, `AppShell`
(isAdmin) yeniden kullanılır.

## Veri akışı

```
/admin/.../[moduleId]/quiz (server, admin guard)
  → getQuizForAdmin(moduleId)  // service_role, dogru DAHİL
  → quiz yok → <ActionButton onAction={createQuiz.bind(null, moduleId)} />
  → quiz var → <QuizMetaForm/> + sorular(<QuestionEditor/>) + <ActionButton createQuestion/> + <DeleteButton deleteQuiz/>

herhangi bir action (client) → await action() → ok ise router.refresh() → server yeniden okur
```

## Hata yönetimi

- Action'lar try/catch; RLS reddi/DB hatası → `{ok:false, error}`; client banner/alert.
- `createServiceClient` anahtarı yoksa `getQuizForAdmin` net hata fırlatır/loglar;
  editör sayfası "Quiz yüklenemedi (servis anahtarı)" gösterir, çökmez.
- Zorunlu alan boş (quiz başlığı, soru/şık metni) → action erken döner.
- `createQuiz` modülde zaten quiz varsa (unique ihlali) → dostça "Bu modülde zaten quiz var".

## Test

- Bu özellik UI/entegrasyon ağırlıklı; **yeni saf fonksiyon yok** → yeni birim testi yok.
- Doğrulama: `tsc` + `npm run test` (mevcut 69 test yeşil kalır) + production build.
- **Elle (dev sunucu + SQL editör, admin & üye hesap):**
  - Admin quiz oluştur/düzenle/sil; soru/şık ekle-düzenle-sil; doğru işaretle.
  - Üye hesabı quiz tablolarına yazamaz (RLS reddi).
  - Üye `/mufredat/quiz/[id]`'de `dogru`'yu hâlâ göremez; admin editörde görür.
  - Eklenen quiz `/mufredat/[lessonId]` (üye) modül quiz kartında çıkar ve çözülebilir.

## Kapsam dışı (sonraki spec'ler)

- Üye/izin listesi (allowlist + role) yönetimi.
- Soru/şık sürükle-bırak sıralama (manuel `sira` kullanılır).
- Farklı soru tipleri (yalnız çoktan/çok-doğru seçmeli).
- v2: pratik görev gönderimi + onayı.
