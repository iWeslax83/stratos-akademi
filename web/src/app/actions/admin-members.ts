"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { actorId, requireAdmin } from "@/lib/auth/actor";
import { normalizeEmail, isValidEmail, cleanAd, type Role } from "@/lib/admin/members";

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
    const supabase = await createClient();
    const gate = await requireAdmin(supabase);
    if (!gate.ok) return { ok: false, error: gate.error };
    const email = normalizeEmail(str(fd, "email"));
    const role = asRole(str(fd, "role"));
    if (!isValidEmail(email)) return { ok: false, error: "Geçerli bir e-posta gir." };
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
    const gate = await requireAdmin(supabase);
    if (!gate.ok) return { ok: false, error: gate.error };
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
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const gate = await requireAdmin(supabase);
    if (!gate.ok) return { ok: false, error: gate.error };
    const selfId = await actorId(supabase);
    if (userId && userId === selfId) {
      return { ok: false, error: "Kendi yetkini değiştiremezsin." };
    }
    const r = asRole(role);

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

// Üyeyi tamamen kaldırır: auth.users silinir → FK cascade ile tüm verisi gider; allowlist da silinir.
// service_role kullanıldığından çağıranın admin olduğu is_admin() ile (caller bağlamı) doğrulanır.
export async function removeMember(userId: string, email: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const gate = await requireAdmin(supabase);
    if (!gate.ok) return { ok: false, error: gate.error };
    const selfId = await actorId(supabase);
    if (userId === selfId) return { ok: false, error: "Kendini kaldıramazsın." };

    const svc = createServiceClient();
    const { error: delErr } = await svc.auth.admin.deleteUser(userId);
    if (delErr) return { ok: false, error: "Üye silinemedi: " + delErr.message };

    await svc.from("allowlist").delete().eq("email", email);
    revalidatePath("/admin/uyeler");
    return { ok: true };
  } catch (e) { console.error("removeMember:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function renameMember(userId: string, ad: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const gate = await requireAdmin(supabase);
    if (!gate.ok) return { ok: false, error: gate.error };
    const selfId = await actorId(supabase);
    if (userId === selfId) return { ok: false, error: "Kendi adını değiştiremezsin." };
    const temiz = cleanAd(ad);
    if (!temiz) return { ok: false, error: "Ad 1-60 karakter olmalı." };
    const { error } = await supabase.from("profiles").update({ ad: temiz }).eq("id", userId);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath("/admin/uyeler");
    return { ok: true };
  } catch (e) {
    console.error("renameMember:", e);
    return { ok: false, error: "Beklenmeyen hata." };
  }
}

export async function linkStratosiha(
  userId: string,
  stratosihaAd: string | null,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const gate = await requireAdmin(supabase);
    if (!gate.ok) return { ok: false, error: gate.error };
    const selfId = await actorId(supabase);
    if (userId === selfId) return { ok: false, error: "Kendi eşleştirmeni değiştiremezsin." };
    const { error } = await supabase
      .from("profiles")
      .update({ stratosiha_ad: stratosihaAd })
      .eq("id", userId);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath("/admin/uyeler");
    return { ok: true };
  } catch (e) {
    console.error("linkStratosiha:", e);
    return { ok: false, error: "Beklenmeyen hata." };
  }
}
