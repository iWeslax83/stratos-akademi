"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidHttpUrl } from "@/lib/resources/group";

export type ActionResult = { ok: boolean; error?: string };

function str(fd: FormData, k: string): string {
  return ((fd.get(k) as string | null) ?? "").trim();
}
function errMsg(error: { code?: string; message?: string }): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message ?? "")) {
    return "Bu işlem için yetkin yok (admin değilsin).";
  }
  return "İşlem başarısız: " + (error.message ?? "bilinmeyen hata");
}

function bust() {
  revalidatePath("/admin/kaynaklar");
  revalidatePath("/kaynaklar");
}

export async function createResource(fd: FormData): Promise<ActionResult> {
  try {
    const baslik = str(fd, "baslik");
    const url = str(fd, "url");
    const kategori = str(fd, "kategori") || "Genel";
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    if (!isValidHttpUrl(url)) return { ok: false, error: "Geçerli bir http(s) bağlantısı gir." };
    const supabase = await createClient();
    // author_id DB'de default auth.uid() ile dolar.
    const { error } = await supabase
      .from("resources")
      .insert({ baslik, url, kategori, aciklama: str(fd, "aciklama") || null });
    if (error) return { ok: false, error: errMsg(error) };
    bust();
    return { ok: true };
  } catch (e) { console.error("createResource:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateResource(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const baslik = str(fd, "baslik");
    const url = str(fd, "url");
    const kategori = str(fd, "kategori") || "Genel";
    if (!id) return { ok: false, error: "id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    if (!isValidHttpUrl(url)) return { ok: false, error: "Geçerli bir http(s) bağlantısı gir." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("resources")
      .update({ baslik, url, kategori, aciklama: str(fd, "aciklama") || null })
      .eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    bust();
    return { ok: true };
  } catch (e) { console.error("updateResource:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteResource(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    bust();
    return { ok: true };
  } catch (e) { console.error("deleteResource:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}
