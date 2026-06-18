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
