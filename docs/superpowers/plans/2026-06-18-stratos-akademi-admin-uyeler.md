# Admin Üye/İzin Listesi Yönetimi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adminlerin izin listesini (davet/rol) ve üye rollerini web arayüzünden yönetmesi.

**Architecture:** allowlist'e admin yazma + profiles'a admin update RLS (`is_admin()` 0010'dan); saf yardımcılar (normalizeEmail/isValidEmail/pendingInvites) TDD; FormData/args server action'lar (`{ok,error}` + revalidatePath); `/admin/uyeler` tek sayfa (üyeler + bekleyen davetler + davet ekle); self-guard ile kilitlenme önlenir.

**Tech Stack:** Next.js 16 (App Router, RSC + Server Actions), TypeScript, Tailwind v3, Supabase (RLS), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-18-stratos-akademi-admin-uyeler-design.md`

---

## Çalışma kuralları (executor için)

- Komutlar `web/` içinde. `@/` → `web/src/`. Migration'ı **kullanıcı** SQL editörde uygular.
- Mevcut: `Card`/`Button`(type HTML attr geçer)/`Eyebrow`, `AppShell`(isAdmin), `DeleteButton`(onDelete+uyari), `createClient` (`@/lib/supabase/server`). `is_admin()` SQL fonksiyonu mevcut (0010). Admin sayfaları `/admin/layout.tsx` guard'ı altında.
- Tailwind: `navy`, `gold`, `muted`, `rounded-core`, `var(--line)`.

## Dosya Yapısı

**Yeni:**
- `web/src/lib/admin/members.ts` — tipler + `normalizeEmail`/`isValidEmail`/`pendingInvites` (saf)
- `supabase/migrations/0012_admin_members_rls.sql`
- `web/src/app/actions/admin-members.ts` — inviteMember/removeInvite/setMemberRole
- `web/src/components/admin/InviteForm.tsx` (client)
- `web/src/components/admin/RoleSelect.tsx` (client)
- `web/src/app/admin/uyeler/page.tsx`

**Değişen:**
- `web/src/components/shell/Nav.tsx` — admin için "Üyeler" linki

---

## Task 0: Dal aç

- [ ] **Step 1**
```bash
cd /home/weslax83/stratos-akademi && git checkout -b feat/admin-uyeler && git branch --show-current
```
Expected: `feat/admin-uyeler`

---

## Task 1: Saf yardımcılar (members.ts)

**Files:** Create `web/src/lib/admin/members.ts` · Test `web/src/test/admin/members.test.ts`

- [ ] **Step 1: Başarısız test**

`web/src/test/admin/members.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { normalizeEmail, isValidEmail, pendingInvites } from "@/lib/admin/members";
import type { AllowlistRow, MemberRow } from "@/lib/admin/members";

describe("normalizeEmail", () => {
  it("trim + küçük harf", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
});

describe("isValidEmail", () => {
  it("geçerli", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("emir.demir@okul.edu.tr")).toBe(true);
  });
  it("geçersiz", () => {
    expect(isValidEmail("abc")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a @b.co")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("pendingInvites", () => {
  const A = (email: string): AllowlistRow => ({ email, role: "uye", created_at: "" });
  const M = (email: string): MemberRow => ({ id: email, email, ad: null, role: "uye", created_at: "" });
  it("profili olmayan davetleri döner (büyük/küçük harf duyarsız)", () => {
    const r = pendingInvites([A("a@x.co"), A("b@x.co")], [M("A@x.co")]);
    expect(r.map((x) => x.email)).toEqual(["b@x.co"]);
  });
  it("üye yoksa hepsi bekler", () => {
    expect(pendingInvites([A("a@x.co")], []).length).toBe(1);
  });
  it("davet yoksa boş", () => {
    expect(pendingInvites([], [M("a@x.co")])).toEqual([]);
  });
});
```

- [ ] **Step 2: Başarısız doğrula**

Run: `cd /home/weslax83/stratos-akademi/web && npx vitest run src/test/admin/members.test.ts`  → FAIL (modül yok)

- [ ] **Step 3: Implementasyon**

`web/src/lib/admin/members.ts`:
```ts
export type Role = "uye" | "admin";
export type AllowlistRow = { email: string; role: Role; created_at: string };
export type MemberRow = { id: string; email: string; ad: string | null; role: Role; created_at: string };

export function normalizeEmail(s: string): string {
  return (s ?? "").trim().toLowerCase();
}

export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Allowlist'te olup eşleşen profili (email) olmayan davetler.
export function pendingInvites(allowlist: AllowlistRow[], members: MemberRow[]): AllowlistRow[] {
  const memberEmails = new Set(members.map((m) => m.email.toLowerCase()));
  return allowlist.filter((a) => !memberEmails.has(a.email.toLowerCase()));
}
```

- [ ] **Step 4: Geçtiğini doğrula**

Run: `cd /home/weslax83/stratos-akademi/web && npx vitest run src/test/admin/members.test.ts`  → PASS (6 test)

- [ ] **Step 5: Commit**
```bash
cd /home/weslax83/stratos-akademi && git add web/src/lib/admin/members.ts web/src/test/admin/members.test.ts && git commit -m "feat(admin): üye yardımcıları (normalizeEmail/isValidEmail/pendingInvites)"
```

---

## Task 2: RLS migration (0012)

**Files:** Create `supabase/migrations/0012_admin_members_rls.sql`

- [ ] **Step 1: Migration dosyasını yaz**

`supabase/migrations/0012_admin_members_rls.sql`:
```sql
-- allowlist: admin yazma (mevcut "allowlist adminlere okunur" SELECT durur; OR'lanır).
create policy "allowlist admin yazar" on public.allowlist
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant insert, update, delete on public.allowlist to authenticated;

-- profiles: admin başkasının profilini güncelleyebilir (rol değişimi için).
-- Mevcut "kendi profilini günceller" + "profiller herkese okunur" durur.
create policy "profiles admin günceller" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
```

- [ ] **Step 2: Kullanıcı uygular**

Kullanıcıdan iste: bu dosyayı Supabase SQL editöründe çalıştırsın ("Success. No rows returned" beklenir).

- [ ] **Step 3: Commit**
```bash
cd /home/weslax83/stratos-akademi && git add supabase/migrations/0012_admin_members_rls.sql && git commit -m "feat(admin): allowlist admin yazma + profiles admin update RLS (0012)"
```

---

## Task 3: Server actions (admin-members.ts)

**Files:** Create `web/src/app/actions/admin-members.ts`

- [ ] **Step 1: Implementasyon**

`web/src/app/actions/admin-members.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeEmail, isValidEmail, type Role } from "@/lib/admin/members";

export type ActionResult = { ok: boolean; error?: string };

function str(fd: FormData, k: string): string {
  return ((fd.get(k) as string | null) ?? "").trim();
}
function asRole(v: string): Role {
  return v === "admin" ? "admin" : "uye";
}
function errMsg(error: { code?: string; message?: string }): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message ?? "")) {
    return "Bu işlem için yetkin yok (admin değilsin).";
  }
  return "İşlem başarısız: " + (error.message ?? "bilinmeyen hata");
}

export async function inviteMember(fd: FormData): Promise<ActionResult> {
  try {
    const email = normalizeEmail(str(fd, "email"));
    const role = asRole(str(fd, "role"));
    if (!isValidEmail(email)) return { ok: false, error: "Geçerli bir e-posta gir." };
    const supabase = await createClient();
    const { error } = await supabase.from("allowlist").insert({ email, role });
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Bu e-posta zaten davetli." };
      return { ok: false, error: errMsg(error) };
    }
    revalidatePath("/admin/uyeler");
    return { ok: true };
  } catch (e) { console.error("inviteMember:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function removeInvite(email: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("allowlist").delete().eq("email", email);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath("/admin/uyeler");
    return { ok: true };
  } catch (e) { console.error("removeInvite:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function setMemberRole(
  email: string,
  role: Role,
  userId: string | null,
  selfId: string,
): Promise<ActionResult> {
  try {
    if (userId && userId === selfId) {
      return { ok: false, error: "Kendi yetkini değiştiremezsin." };
    }
    const r = asRole(role);
    const supabase = await createClient();

    const { error: allowErr } = await supabase.from("allowlist").update({ role: r }).eq("email", email);
    if (allowErr) return { ok: false, error: errMsg(allowErr) };

    if (userId) {
      const { error: profErr } = await supabase.from("profiles").update({ role: r }).eq("id", userId);
      if (profErr) return { ok: false, error: errMsg(profErr) };
    }
    revalidatePath("/admin/uyeler");
    return { ok: true };
  } catch (e) { console.error("setMemberRole:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}
```

- [ ] **Step 2: Tip + commit**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit`  → hata yok
```bash
cd /home/weslax83/stratos-akademi && git add web/src/app/actions/admin-members.ts && git commit -m "feat(admin): üye yönetimi server action'ları (davet/sil/rol + self-guard)"
```

---

## Task 4: InviteForm + RoleSelect bileşenleri

**Files:** Create `web/src/components/admin/InviteForm.tsx`, `web/src/components/admin/RoleSelect.tsx`

- [ ] **Step 1: RoleSelect (client)**

`web/src/components/admin/RoleSelect.tsx`:
```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMemberRole } from "@/app/actions/admin-members";
import type { Role } from "@/lib/admin/members";

export function RoleSelect({
  email,
  role,
  userId,
  selfId,
}: {
  email: string;
  role: Role;
  userId: string | null;
  selfId: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const isSelf = userId !== null && userId === selfId;

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const yeni = e.target.value as Role;
    start(async () => {
      const r = await setMemberRole(email, yeni, userId, selfId);
      if (!r.ok) window.alert(r.error ?? "Hata");
      router.refresh();
    });
  }

  return (
    <select
      value={role}
      onChange={onChange}
      disabled={pending || isSelf}
      className="rounded-lg border border-[var(--line)] bg-transparent px-2.5 py-1.5 text-sm font-semibold text-navy outline-none focus:border-gold disabled:opacity-60 dark:text-white"
    >
      <option value="uye">Üye</option>
      <option value="admin">Admin</option>
    </select>
  );
}
```

- [ ] **Step 2: InviteForm (client)**

`web/src/components/admin/InviteForm.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { inviteMember } from "@/app/actions/admin-members";

export function InviteForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    start(async () => {
      const r = await inviteMember(fd);
      if (!r.ok) { setError(r.error ?? "Hata"); return; }
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      {error && <p className="w-full text-sm font-semibold text-red-600">{error}</p>}
      <label className="block min-w-[220px] flex-1">
        <span className="mb-1 block text-xs font-semibold text-muted">E-posta</span>
        <input
          name="email"
          type="email"
          required
          placeholder="uye@okul.edu.tr"
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-gold dark:text-white"
        />
      </label>
      <label className="block w-32">
        <span className="mb-1 block text-xs font-semibold text-muted">Rol</span>
        <select
          name="role"
          defaultValue="uye"
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        >
          <option value="uye">Üye</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <Button variant="gold" disabled={pending}>{pending ? "…" : "Davet et"}</Button>
    </form>
  );
}
```

- [ ] **Step 3: Tip + commit**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit`  → hata yok
```bash
cd /home/weslax83/stratos-akademi && git add web/src/components/admin/InviteForm.tsx web/src/components/admin/RoleSelect.tsx && git commit -m "feat(admin): InviteForm + RoleSelect bileşenleri"
```

---

## Task 5: Üyeler sayfası + Nav "Üyeler" linki

**Files:** Create `web/src/app/admin/uyeler/page.tsx` · Modify `web/src/components/shell/Nav.tsx`

- [ ] **Step 1: Üyeler sayfası**

`web/src/app/admin/uyeler/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { InviteForm } from "@/components/admin/InviteForm";
import { RoleSelect } from "@/components/admin/RoleSelect";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { removeInvite } from "@/app/actions/admin-members";
import { pendingInvites, type AllowlistRow, type MemberRow } from "@/lib/admin/members";

export const dynamic = "force-dynamic";

export default async function AdminUyelerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("ad, email")
    .eq("id", user!.id)
    .single();
  const initial = (me?.ad ?? me?.email ?? "E").charAt(0).toUpperCase();
  const selfId = user!.id;

  const { data: membersData } = await supabase
    .from("profiles")
    .select("id, email, ad, role, created_at")
    .order("created_at");
  const { data: allowData } = await supabase
    .from("allowlist")
    .select("email, role, created_at")
    .order("created_at");
  const members = (membersData ?? []) as MemberRow[];
  const allowlist = (allowData ?? []) as AllowlistRow[];
  const pending = pendingInvites(allowlist, members);

  return (
    <AppShell initial={initial} isAdmin>
      <Eyebrow>Yönetim · Üyeler</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
        Üyeler ve Davetler
      </h1>

      <Card className="mt-5 p-6">
        <h2 className="mb-3 font-display text-lg font-bold text-navy dark:text-white">
          Üyeler ({members.length})
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-muted">Henüz üye yok.</p>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 border-b border-[var(--line)] py-3 last:border-b-0">
              <span className="flex-1 text-sm font-semibold text-navy dark:text-white">
                {m.ad ?? m.email}{" "}
                <span className="text-xs font-normal text-muted">{m.email}</span>
                {m.id === selfId && <span className="ml-2 text-xs font-bold text-gold">(sen)</span>}
              </span>
              <RoleSelect email={m.email} role={m.role} userId={m.id} selfId={selfId} />
            </div>
          ))
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-3 font-display text-lg font-bold text-navy dark:text-white">
          Bekleyen davetler ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted">Bekleyen davet yok.</p>
        ) : (
          pending.map((a) => (
            <div key={a.email} className="flex items-center gap-3 border-b border-[var(--line)] py-3 last:border-b-0">
              <span className="flex-1 text-sm font-semibold text-navy dark:text-white">{a.email}</span>
              <RoleSelect email={a.email} role={a.role} userId={null} selfId={selfId} />
              <DeleteButton
                onDelete={removeInvite.bind(null, a.email)}
                uyari={`"${a.email}" davetini silmek istediğine emin misin?`}
              />
            </div>
          ))
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-navy dark:text-white">Davet et</h2>
        <InviteForm />
      </Card>
    </AppShell>
  );
}
```

- [ ] **Step 2: Nav'a "Üyeler" linki**

`web/src/components/shell/Nav.tsx` içinde mevcut admin link bloğu:
```tsx
        {isAdmin && (
          <Link href="/admin/mufredat" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-gold hover:opacity-80">
            Yönetim
          </Link>
        )}
```
şu hale gelsin (Yönetim'den sonra Üyeler eklenir):
```tsx
        {isAdmin && (
          <>
            <Link href="/admin/mufredat" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-gold hover:opacity-80">
              Yönetim
            </Link>
            <Link href="/admin/uyeler" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-gold hover:opacity-80">
              Üyeler
            </Link>
          </>
        )}
```

- [ ] **Step 3: Build + test**

Run: `cd /home/weslax83/stratos-akademi/web && npx tsc --noEmit && npm run test`  → tsc temiz, tüm testler PASS (members testleri dahil)
Run: `cd /home/weslax83/stratos-akademi/web && npm run build`  → başarılı (yeni `/admin/uyeler` rotası derlenir)

- [ ] **Step 4: Commit**
```bash
cd /home/weslax83/stratos-akademi && git add web/src/app/admin/uyeler/page.tsx web/src/components/shell/Nav.tsx && git commit -m "feat(admin): üyeler sayfası + Nav Üyeler linki"
```

---

## Task 6: Tam doğrulama + main'e merge + hafıza

- [ ] **Step 1: Tüm test + build**

Run: `cd /home/weslax83/stratos-akademi/web && npm run test && npm run build`  → testler PASS, build başarılı.

- [ ] **Step 2: Migration uygulama hatırlat**

Kullanıcıya hatırlat: `0012_admin_members_rls.sql` SQL editöründe çalıştırılmalı (yapılmadıysa).

- [ ] **Step 3: Uçtan uca elle kontrol (dev sunucu, admin & üye)**

- Admin: Nav'da "Üyeler" → `/admin/uyeler`. Davet ekle (geçerli/geçersiz e-posta, dup); bekleyen daveti sil; bir üyenin rolünü değiştir (profiles+allowlist ikisi de değişir).
- Self-guard: admin kendi satırında rol select kilitli; aksiyon reddeder.
- Üye (admin değil): `/admin/uyeler` → `/panom`'a yönlenir; allowlist/profiles'a yazamaz (RLS).
- Yeni davet edilen e-posta Google ile giriş yapabilir (trigger profil oluşturur, doğru rol).

- [ ] **Step 4: main'e merge**
```bash
cd /home/weslax83/stratos-akademi && git checkout main && git merge --no-ff feat/admin-uyeler -m "Merge feat/admin-uyeler: admin üye/izin listesi yönetimi (davet + rol + self-guard)" && git push origin main
```

- [ ] **Step 5: Hafıza güncelle**

`stratos-akademi-platform.md` memory: "Admin: Üye yönetimi TAMAM" ekle (0012 RLS, davet/rol/self-guard, rol değişimi profiles+allowlist sync). "Sıradaki plan"ı v2'ye (pratik görev gönderimi + onayı) güncelle.

---

## Spec Kapsam Kontrolü (öz-değerlendirme)

- allowlist admin yazma + profiles admin update RLS (0012) → Task 2 ✓
- Saf yardımcılar (normalizeEmail/isValidEmail/pendingInvites) TDD → Task 1 ✓
- inviteMember/removeInvite/setMemberRole ({ok,error}) → Task 3 ✓
- Self-guard (kendi rolü) → Task 3 (action) + Task 4 (select disabled) ✓
- Rol değişimi profiles + allowlist sync → Task 3 ✓
- /admin/uyeler: üyeler + bekleyen davetler + davet ekle → Task 5 ✓
- Nav "Üyeler" linki (yalnız admin) → Task 5 ✓
- Hata yönetimi (geçersiz e-posta, dup, RLS) → Task 3 ✓
- Testler (members helpers) → Task 1 ✓
```
