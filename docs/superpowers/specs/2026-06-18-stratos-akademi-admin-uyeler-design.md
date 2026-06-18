# Stratos Akademi — Admin: Üye/İzin Listesi Yönetimi Tasarımı

**Tarih:** 2026-06-18
**Durum:** Onaylandı
**Önceki:** Foundation, Müfredat, Quiz, Dashboard, Admin Müfredat CRUD, Admin Quiz CRUD (hepsi `main`'de)

## Amaç

Adminlerin kimlerin giriş yapabileceğini (izin listesi) ve mevcut üyelerin
rolünü (üye/admin) web arayüzünden yönetmesi. Admin panelinin üçüncü parçası.

## Kapsam ve karar özeti

- `/admin/uyeler` tek sayfa: aktif üyeler + bekleyen davetler + davet ekleme.
- Operasyonlar: davet ekle (e-posta + rol), bekleyen daveti sil, rol değiştir.
- **Tam üye silme yok** (auth admin API gerektirir → v2).
- Rol değişimi **hem `profiles.role` hem `allowlist.role`**'ü günceller.
- **Self-guard:** admin kendi rolünü değiştiremez (kilitlenme önlenir).

## Mevcut durum (bulgular, 0001)

- `allowlist(email PK, role 'uye'|'admin' default 'uye', created_at)` — kimler giriş
  yapabilir + kayıt anı rolü. RLS: yalnız adminler SELECT. **Yazma politikası yok.**
- `profiles(id, email, ad, role 'uye'|'admin', avatar_url, created_at)` — kayıtta
  `handle_new_user` trigger'ı allowlist'ten oluşturur. RLS: herkes (authenticated)
  SELECT; **yalnız kendi** UPDATE. Admin başkasının rolünü değiştiremiyor.
- **Nüans:** `allowlist.role` yalnız kayıt anında profile kopyalanır; sonradan
  değiştirmek mevcut üyenin `profiles.role`'unu etkilemez → rol değişiminde iki tablo
  da güncellenmeli.
- `is_admin()` SECURITY DEFINER helper mevcut (0010).

## Mimari

### Yetki & güvenlik (migration `0012_admin_members_rls.sql`)
```sql
-- allowlist: admin yazma (mevcut "adminlere okunur" SELECT durur).
create policy "allowlist admin yazar" on public.allowlist
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant insert, update, delete on public.allowlist to authenticated;

-- profiles: admin başkasının profilini güncelleyebilir (rol değişimi için).
-- Mevcut "kendi profilini günceller" + "herkese okunur" politikaları durur.
create policy "profiles admin günceller" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
```
Notlar:
- `allowlist` için `for all` SELECT'i de kapsar ama mevcut admin SELECT politikası
  zaten var; OR'lanır. Yazma yalnız `is_admin()`.
- `profiles` admin update politikası adminin her satırı güncellemesine izin verir
  (kolon kısıtı yok); admin güvenilir kabul edilir. Self-demote footgun'u server
  action'da engellenir.

### Saf yardımcılar (`web/src/lib/admin/members.ts`)
```ts
export type Role = "uye" | "admin";
export type AllowlistRow = { email: string; role: Role; created_at: string };
export type MemberRow = { id: string; email: string; ad: string | null; role: Role; created_at: string };

export function normalizeEmail(s: string): string;   // trim + toLowerCase
export function isValidEmail(s: string): boolean;     // basit format: x@y.z
export function pendingInvites(allowlist: AllowlistRow[], members: MemberRow[]): AllowlistRow[];
// profili (eşleşen email) olmayan allowlist satırları
```

### Server actions (`web/src/app/actions/admin-members.ts`, `{ok,error}`)
Hepsi try/catch + `errMsg` (RLS reddini dostça çevirir, admin-curriculum kalıbı);
`revalidatePath("/admin/uyeler")`.

- `inviteMember(fd: FormData)` — [email, role]. `normalizeEmail`+`isValidEmail`
  doğrular; geçersizse `{ok:false,error}`. allowlist insert; unique ihlali (23505)
  → "Bu e-posta zaten davetli.".
- `removeInvite(email: string)` — allowlist satırını sil.
- `setMemberRole(email: string, role: Role, userId: string | null, selfId: string)` —
  - **Self-guard:** `userId && userId === selfId` → `{ok:false, error:"Kendi yetkini değiştiremezsin."}`.
  - `allowlist` update role where email.
  - `userId` varsa `profiles` update role where id=userId.

### UI

**`web/src/app/admin/uyeler/page.tsx`** (server, admin guard layout altında):
- AppShell `isAdmin`; Eyebrow "Yönetim · Üyeler".
- Veri: `profiles` (id,email,ad,role,created_at) + `allowlist` (email,role,created_at).
  `pendingInvites(allowlist, members)` ile bekleyenler hesaplanır. Mevcut kullanıcı
  id'si self-guard için alınır.
- **Üyeler** kartı: her satır e-posta + ad + `RoleSelect` + kendisiyse "(sen)" (select kilitli).
- **Bekleyen davetler** kartı: e-posta + `RoleSelect` (userId=null) + `DeleteButton`
  (removeInvite). Boşsa "Bekleyen davet yok".
- **Davet ekle** kartı: `InviteForm` (e-posta input + rol select + Ekle).

**Yeni client bileşenler (`web/src/components/admin/`):**
- `InviteForm.tsx` — onSubmit → inviteMember → router.refresh + form reset.
- `RoleSelect.tsx` — `<select>` üye/admin; değişince `setMemberRole(email, role, userId, selfId)`
  → router.refresh. `disabled` if `userId === selfId`.

**Nav** (`web/src/components/shell/Nav.tsx`): `isAdmin` true ise mevcut "Yönetim"
(`/admin/mufredat`) yanına "Üyeler" (`/admin/uyeler`) linki.

## Veri akışı

```
/admin/uyeler (server, admin guard)
  → profiles + allowlist oku → pendingInvites(...) → mevcut user.id
  → <RoleSelect/> (üye+pending), <DeleteButton removeInvite/> (pending), <InviteForm/>

action (client) → await → ok ise router.refresh()
setMemberRole: self-guard → allowlist.role + (varsa) profiles.role
```

## Hata yönetimi

- `inviteMember`: geçersiz e-posta → net hata; dup (23505) → "zaten davetli".
- `setMemberRole`: self-guard; RLS reddi → dostça mesaj.
- Tüm action'lar try/catch; UI banner/alert; sayfa çökmez.

## Test

**Vitest (saf):**
- `members.test.ts` — `normalizeEmail` (trim/lowercase); `isValidEmail` (geçerli/geçersiz);
  `pendingInvites` (profili olan hariç, olmayan dahil, boş listeler).

**Elle (dev sunucu + SQL editör, admin & üye):**
- Admin davet ekle/sil; üye rolünü admin yap / geri al (profiles+allowlist ikisi de değişir).
- Self-guard: admin kendi rolünü değiştiremez (select kilitli + action reddi).
- Üye (admin değil) `/admin/uyeler`'e giderse `/panom`'a yönlenir; yazamaz (RLS).
- Yeni davet edilen e-posta Google ile giriş yapabilir (trigger profil oluşturur).

## Kapsam dışı (sonraki)

- Tam üye silme (Supabase auth admin API) — v2.
- Toplu davet / CSV içe aktarma; e-posta bildirimi.
- v2: pratik görev gönderimi + onayı.
