# Deploy Rehberi — Stratos Akademi

Uygulama kodu prod-ready (tsc/eslint/build temiz). Aşağıdaki adımlar **koddan değil, deploy ortamı + Supabase** tarafından yapılır. Sırayla takip et.

---

## 1. Supabase: migration'ları uygula

SQL editor'de `supabase/migrations/` altındaki dosyaları **numara sırasıyla** çalıştır (`0001` → `0027`). Zaten uygulanmışları atla.

Doğrulama — şu tabloların var olduğunu kontrol et:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Olması gereken 20 tablo: `allowlist`, `profiles`, `tracks`, `modules`, `lessons`,
`lesson_progress`, `quizzes`, `questions`, `question_options`, `quiz_attempts`,
`practical_tasks`, `task_submissions`, `submission_comments`, `notifications`,
`user_badges`, `user_competencies`, `announcements`, `events`, `resources`,
`lesson_questions`.

> SQL editor'de ham SQL ile tablo oluşturduysan `grant ... to authenticated` **şart** —
> RLS tek başına yetmez (yoksa runtime'da `42501`). Migration dosyaları bu grant'ları içerir.

---

## 2. İlk admin'i tohumla (KRİTİK — atlanırsa kimse giremez)

Giriş akışı: Google OAuth → `handle_new_user` trigger'ı e-postayı `allowlist`'te arar.
**Listede yoksa kayıt reddedilir** (`/login?error=not_allowed`). Yani ilk admin elle eklenmeli:

```sql
insert into public.allowlist (email, role)
values ('senin-kaptan-mailin@gmail.com', 'admin')
on conflict (email) do update set role = 'admin';
```

Bundan sonra yeni üyeler **admin panelinden** (`/admin/uyeler`) eklenir; elle SQL gerekmez.

---

## 3. Google OAuth ayarı (Supabase + Google Cloud)

1. **Supabase → Authentication → Providers → Google**: açık olmalı, Google Client ID + Secret girilmeli.
2. **Supabase → Authentication → URL Configuration → Redirect URLs**: prod domain'i ekle:
   - `https://SENIN-DOMAIN.com/auth/callback`
   - (geliştirme için ayrıca `http://localhost:3000/auth/callback`)
3. **Google Cloud Console → OAuth Client → Authorized redirect URIs**:
   - `https://zgsofbsauyeyefhetlbf.supabase.co/auth/v1/callback` (Supabase callback'i)

---

## 4. Ortam değişkenleri (Vercel / deploy platformu)

| Değişken | Zorunlu | Not |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase proje URL'i |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon (public) anahtar |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Sunucu-only.** Asla `NEXT_PUBLIC_` yapma, asla commit etme |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Prod domain (örn. `https://akademi.stratos.com`) |
| `RESEND_API_KEY` | ⬜ | E-posta bildirimi için. Yoksa e-posta sessizce atlanır |
| `MAIL_FROM` | ⬜ | Gönderen adresi (Resend'de doğrulanmış domain) |

> Gerçek değerler yalnızca deploy platformunun env panelinde ve yerelde `web/.env.local`'de
> (gitignored) tutulur. Hiçbiri repo'ya commit edilmez. Şablon: `web/.env.example`.

---

## 5. Build ayarı

Next.js projesi `web/` alt dizininde. Deploy platformunda:

- **Root Directory:** `web`
- **Build Command:** `next build` (varsayılan)
- **Install Command:** `npm install` (varsayılan)

---

## 6. Deploy sonrası duman testi (smoke test)

- [ ] Ana sayfa açılıyor, `/login`'e yönlendiriyor
- [ ] Google ile giriş → izin listesindeki admin `/panom`'a düşüyor
- [ ] İzin listesinde **olmayan** bir hesap reddediliyor (`error=not_allowed`)
- [ ] `/admin/*` rotaları yalnızca admin'e açık (üye `/panom`'a yönleniyor)
- [ ] Admin panelinden bir üye davet et → o üye girebiliyor
- [ ] Bir ders aç → video oynuyor, "İzledim" çalışıyor, quiz çözülüyor

---

## Yerel doğrulama (push'tan önce)

```bash
cd web
npx tsc --noEmit          # tip kontrolü
npx eslint src --quiet    # lint
npx next build            # prod build
npx vitest run --no-file-parallelism   # testler (paralel değil — ortam thrash'i önler)
```
