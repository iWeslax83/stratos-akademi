# Stratos Akademi — Admin: Müfredat CRUD Tasarımı

**Tarih:** 2026-06-17
**Durum:** Onaylandı
**Önceki:** Foundation, Müfredat, Quiz, Dashboard (hepsi `main`'de)

## Amaç

Adminlerin müfredatı (dal/modül/ders) SQL editörü olmadan, web arayüzünden
ekleyip düzenleyip silebilmesi. Admin panelinin ilk parçası; quiz CRUD ve üye
yönetimi sonraki spec'ler.

## Kapsam ve karar özeti

- **İlk parça:** yalnız müfredat CRUD (dal/modül/ders). Quiz CRUD + üye/izin
  listesi yönetimi kapsam dışı (sonraki spec'ler).
- **Etkileşim:** seviye-seviye sayfalar, sunucu-öncelikli (server components +
  server actions), mevcut kalıba uyumlu.
- **Silme:** onaylı hard delete; dal/modül cascade (DB `on delete cascade`)
  uyarısıyla.
- **Sıralama:** manuel `sira` sayı alanı (sürükle-bırak kapsam dışı).
- **Slug:** dal slug'ı oluşturmada belirlenir; düzenlemede uyarı (yetkinlikleri
  kopuk bırakır).

## Mevcut durum (bulgular)

- Admin kavramı zaten var: `profiles.role` ('uye'/'admin') ve `allowlist.role`.
- İçerik tabloları (tracks/modules/lessons/quizzes/questions/question_options)
  yalnız SELECT RLS'ine sahip; yazma yok → içerik şu an sadece SQL seed ile.
- Şema: `tracks(id, slug, ad, aciklama, ikon, sira)`,
  `modules(id, track_id, ad, aciklama, sira)`,
  `lessons(id, module_id, baslik, youtube_video_id, aciklama, sure_sn, sira)`.
  `modules.track_id` ve `lessons.module_id` `on delete cascade`.

## Mimari

### Yetki & güvenlik (RLS)

**Migration `0010_admin_curriculum_rls.sql`:**
```sql
-- auth.uid()'in admin olup olmadığını döndürür. SECURITY DEFINER: profiles'a
-- RLS özyinelemesine girmeden okur. search_path sabit.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$func$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admin yazma politikaları (üyeler hâlâ yalnız okur; mevcut SELECT politikaları durur)
create policy "tracks admin yazar" on public.tracks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "modules admin yazar" on public.modules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "lessons admin yazar" on public.lessons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant insert, update, delete on public.tracks to authenticated;
grant insert, update, delete on public.modules to authenticated;
grant insert, update, delete on public.lessons to authenticated;
```
Not: `for all` politikası SELECT'i de kapsar ama mevcut "okunur" SELECT
politikaları zaten authenticated'a açık olduğu için üye okuması bozulmaz
(politikalar OR'lanır). Yazma yalnız `is_admin()` true ise geçer.

**Guard:** `/admin/*` için `app/admin/layout.tsx` (server): `profiles.role`'u
okur; `admin` değilse `/panom`'a `redirect`. Nav'a "Yönetim" linki yalnız admine.

### Rotalar & UI

- `app/admin/layout.tsx` — admin guard + breadcrumb iskeleti (AppShell sarmalar).
- `app/admin/mufredat/page.tsx` — dallar listesi + ekle/düzenle formu + sil.
- `app/admin/mufredat/[trackId]/page.tsx` — o dalın modülleri.
- `app/admin/mufredat/[trackId]/[moduleId]/page.tsx` — o modülün dersleri.

Her sayfa: başlıkta breadcrumb, altında öğe listesi (sıra'ya göre), her satırda
"düzenle" + "sil" + (dal/modül için) alt seviyeye git linki, en altta ekle formu.
Düzenleme: satırdaki "düzenle" formu doldurulmuş gösterir (query param
`?edit=<id>` ile aynı sayfada).

**Form alanları:**
- Dal: `ad` (zorunlu), `slug` (zorunlu, oluşturmada; slugify önerisi), `aciklama`,
  `ikon`, `sira` (sayı).
- Modül: `ad` (zorunlu), `aciklama`, `sira`. (`track_id` rotadan.)
- Ders: `baslik` (zorunlu), `youtube_video_id` (zorunlu; tam URL veya 11-hane id),
  `aciklama`, `sure_sn` (sayı), `sira`. (`module_id` rotadan.)

### Server actions & saf yardımcılar

**`web/src/lib/admin/youtube.ts`** — `parseYouTubeId(input: string): string | null`
- Tam URL'lerden (`watch?v=`, `youtu.be/`, `embed/`, `shorts/`) 11-hane id çıkarır;
  zaten 11-hane geçerli id ise olduğu gibi döner; aksi halde `null`.

**`web/src/lib/admin/slug.ts`** — `slugify(s: string): string`
- Türkçe karakterleri sadeleştirir (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u), küçük harf,
  boş/özel → tek `-`, baş/son `-` kırpılır.

**`web/src/app/actions/admin-curriculum.ts`** ("use server") — her biri
`Promise<{ ok: boolean; error?: string }>` döner, `revalidatePath` çağırır,
try/catch ile sarılı; yetki RLS ile (admin değilse insert/update/delete 0 satır
veya hata → `{ok:false}`):
- `createTrack(form)`, `updateTrack(id, form)`, `deleteTrack(id)`
- `createModule(trackId, form)`, `updateModule(id, form)`, `deleteModule(id)`
- `createLesson(moduleId, form)`, `updateLesson(id, form)`, `deleteLesson(id)`

`form` alanları `FormData`'dan okunur; `youtube_video_id` `parseYouTubeId` ile
normalize edilir, `null` ise `{ok:false, error:"Geçersiz YouTube bağlantısı"}`.
Zorunlu alan boşsa `{ok:false, error:"..."}`.

### Bileşenler

- `web/src/components/admin/AdminBreadcrumb.tsx` — dal/modül zinciri.
- `web/src/components/admin/EntityRow.tsx` — liste satırı (ad + sıra + düzenle/sil
  + opsiyonel alt-seviye linki). Sil için onay (client) — cascade uyarı metni prop.
- `web/src/components/admin/TrackForm.tsx`, `ModuleForm.tsx`, `LessonForm.tsx` —
  client form bileşenleri; server action çağırır, `{ok,error}` → banner.
- Mevcut `Card`, `Button`, `Eyebrow` yeniden kullanılır.

### Nav

`web/src/components/shell/Nav.tsx` — `isAdmin?: boolean` prop; true ise "Yönetim"
linki (`/admin/mufredat`). `AppShell` `isAdmin` geçişi. Sayfalar profili okuyup
geçirir.

## Veri akışı

```
/admin/* (layout, server)
  → profiles.role oku → admin değilse redirect /panom

/admin/mufredat (server)
  → tracks listesi (sira'ya göre)
  → <TrackForm/> (ekle ya da ?edit=id ile düzenle)
  → satırlar: <EntityRow/> (düzenle linki ?edit=, sil → deleteTrack)

createTrack/updateTrack/... (server action)
  → FormData oku → doğrula (zorunlu, parseYouTubeId) → supabase insert/update/delete
  → revalidatePath → {ok} / {ok:false,error}
```

## Hata yönetimi

- Server action'lar try/catch; RLS reddi / DB hatası → `{ok:false, error}`,
  UI banner gösterir, sayfa çökmez.
- Form doğrulama: zorunlu alan boş → action erken döner.
- Geçersiz YouTube bağlantısı → net hata.
- Silme: client onay (cascade için uyarı metni); onaysız çağrı yok.

## Test

**Vitest (saf):**
- `youtube.test.ts` — `parseYouTubeId`: watch?v=, youtu.be, embed, shorts, çıplak
  11-hane id, geçersiz → null.
- `slug.test.ts` — `slugify`: Türkçe karakter, boşluk, özel karakter, baş/son tire.

**Elle (dev sunucu + SQL editör):**
- `is_admin()` admin için true, üye için false.
- Admin RLS: üye hesabı insert/update/delete yapamaz (RLS reddi); admin yapar.
- Guard: üye `/admin`'e giderse `/panom`'a yönlenir; Nav'da "Yönetim" üyede yok.
- CRUD uçtan uca: dal→modül→ders ekle/düzenle/sil; cascade uyarısı; YouTube URL
  yapıştırınca id'ye dönüşür.

## Kapsam dışı (sonraki spec'ler)

- Quiz CRUD (quizzes/questions/question_options).
- Üye/izin listesi (allowlist + role) yönetimi.
- Sürükle-bırak sıralama; görsel/dosya yükleme; toplu içe aktarma.
