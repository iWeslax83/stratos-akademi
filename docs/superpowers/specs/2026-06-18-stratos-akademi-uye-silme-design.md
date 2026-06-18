# Stratos Akademi — Tam Üye Silme Tasarımı

**Tarih:** 2026-06-18
**Durum:** Onaylandı (otonom)
**Önceki:** Admin üye yönetimi (rol+davet) + tüm v1/v2 — `main`'de

## Amaç

Adminin bir üyeyi tamamen kaldırması: auth kullanıcısı + tüm verisi (profil,
ilerleme, quiz denemeleri, yetkinlikler, görev gönderimleri) + izin listesi kaydı.
Üye yönetimi v1'de "kapsam dışı (v2)" denmişti; burada eklenir.

## Kararlar (otonom)

- "Kaldır" yalnız **aktif üyeler** (profiles) için, **kendisi hariç** (self-guard).
- Silme: `service_role` **auth admin API** (`auth.admin.deleteUser`) → `auth.users`
  silinir → FK `on delete cascade` ile profiles/lesson_progress/quiz_attempts/
  user_competencies/task_submissions otomatik gider. Ayrıca `allowlist` satırı silinir
  (yeniden kayıt olamasın).
- **Güvenlik:** action service_role kullandığından (RLS bypass) çağıranın admin olduğu
  `is_admin()` RPC ile (caller JWT bağlamı) DOĞRULANIR — `getUser` çağrılmaz.
- **Bilinen sınır:** Storage'daki yüklenmiş dosyalar (`gorev-dosyalari`) silinmez
  (yetim kalır) — sonraki temizlik işi. Migration GEREKMEZ.

## Mimari

### Server action (`web/src/app/actions/admin-members.ts` — eklenir)
```ts
export async function removeMember(userId: string, email: string, selfId: string): Promise<ActionResult>;
```
- `const supabase = await createClient(); const { data: amAdmin } = await supabase.rpc("is_admin");`
  `if (!amAdmin) return { ok:false, error:"Yetkin yok." };` (gerçek güvenlik kontrolü; caller bağlamı).
- `if (userId === selfId) return { ok:false, error:"Kendini kaldıramazsın." };`
- `const svc = createServiceClient(); const { error } = await svc.auth.admin.deleteUser(userId);`
  hata → dostça mesaj.
- `await svc.from("allowlist").delete().eq("email", email);` (best-effort).
- `revalidatePath("/admin/uyeler")`; `{ ok:true }`. try/catch.

### UI (`web/src/app/admin/uyeler/page.tsx` — eklenir)
- Üye satırında `RoleSelect`'in yanına, **kendisi değilse**, `DeleteButton`:
  `onDelete={removeMember.bind(null, m.id, m.email, selfId)}`,
  `uyari="<email> üyesini ve TÜM verilerini (ilerleme, quiz, görev) kalıcı silmek istediğine emin misin?"`.

## Hata yönetimi
- Admin değilse RPC kontrolü reddeder. Self-guard. `deleteUser` hatası → banner/alert.
- service_role anahtarı yoksa → dostça hata.

## Test
Yeni saf fonksiyon yok → yeni birim testi yok; tsc + build + elle (admin başka üyeyi siler;
kendini silemez; üye action'ı çağıramaz çünkü `is_admin()` false).

## Kapsam dışı
Storage dosya temizliği; "soft delete"/arşiv; toplu silme.
