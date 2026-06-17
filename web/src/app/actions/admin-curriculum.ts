"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseYouTubeId } from "@/lib/admin/youtube";

export type ActionResult = { ok: boolean; error?: string };

function str(fd: FormData, k: string): string {
  return ((fd.get(k) as string | null) ?? "").trim();
}
function intOr(fd: FormData, k: string, def: number): number {
  const v = parseInt(str(fd, k), 10);
  return Number.isFinite(v) ? v : def;
}
function intOrNull(fd: FormData, k: string): number | null {
  const s = str(fd, k);
  if (!s) return null;
  const v = parseInt(s, 10);
  return Number.isFinite(v) ? v : null;
}
function errMsg(error: { code?: string; message?: string }): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message ?? "")) {
    return "Bu işlem için yetkin yok (admin değilsin).";
  }
  return "İşlem başarısız: " + (error.message ?? "bilinmeyen hata");
}

// ---- TRACK ----
export async function createTrack(fd: FormData): Promise<ActionResult> {
  try {
    const ad = str(fd, "ad");
    const slug = str(fd, "slug");
    if (!ad || !slug) return { ok: false, error: "Ad ve slug zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase.from("tracks").insert({
      ad, slug,
      aciklama: str(fd, "aciklama") || null,
      ikon: str(fd, "ikon") || null,
      sira: intOr(fd, "sira", 0),
    });
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath("/admin/mufredat");
    return { ok: true };
  } catch (e) { console.error("createTrack:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateTrack(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const ad = str(fd, "ad");
    const slug = str(fd, "slug");
    if (!id) return { ok: false, error: "id eksik." };
    if (!ad || !slug) return { ok: false, error: "Ad ve slug zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase.from("tracks").update({
      ad, slug,
      aciklama: str(fd, "aciklama") || null,
      ikon: str(fd, "ikon") || null,
      sira: intOr(fd, "sira", 0),
    }).eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath("/admin/mufredat");
    return { ok: true };
  } catch (e) { console.error("updateTrack:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteTrack(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("tracks").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath("/admin/mufredat");
    return { ok: true };
  } catch (e) { console.error("deleteTrack:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- MODULE ----
export async function createModule(fd: FormData): Promise<ActionResult> {
  try {
    const trackId = str(fd, "track_id");
    const ad = str(fd, "ad");
    if (!trackId) return { ok: false, error: "track_id eksik." };
    if (!ad) return { ok: false, error: "Ad zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase.from("modules").insert({
      track_id: trackId, ad,
      aciklama: str(fd, "aciklama") || null,
      sira: intOr(fd, "sira", 0),
    });
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}`);
    return { ok: true };
  } catch (e) { console.error("createModule:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateModule(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const trackId = str(fd, "track_id");
    const ad = str(fd, "ad");
    if (!id || !trackId) return { ok: false, error: "id/track_id eksik." };
    if (!ad) return { ok: false, error: "Ad zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase.from("modules").update({
      ad,
      aciklama: str(fd, "aciklama") || null,
      sira: intOr(fd, "sira", 0),
    }).eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}`);
    return { ok: true };
  } catch (e) { console.error("updateModule:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteModule(id: string, trackId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}`);
    return { ok: true };
  } catch (e) { console.error("deleteModule:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- LESSON ----
export async function createLesson(fd: FormData): Promise<ActionResult> {
  try {
    const moduleId = str(fd, "module_id");
    const trackId = str(fd, "track_id");
    const baslik = str(fd, "baslik");
    if (!moduleId || !trackId) return { ok: false, error: "module_id/track_id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    const vid = parseYouTubeId(str(fd, "youtube"));
    if (!vid) return { ok: false, error: "Geçersiz YouTube bağlantısı veya id." };
    const supabase = await createClient();
    const { error } = await supabase.from("lessons").insert({
      module_id: moduleId, baslik, youtube_video_id: vid,
      aciklama: str(fd, "aciklama") || null,
      sure_sn: intOrNull(fd, "sure_sn"),
      sira: intOr(fd, "sira", 0),
    });
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}/${moduleId}`);
    return { ok: true };
  } catch (e) { console.error("createLesson:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateLesson(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const moduleId = str(fd, "module_id");
    const trackId = str(fd, "track_id");
    const baslik = str(fd, "baslik");
    if (!id || !moduleId || !trackId) return { ok: false, error: "id/module_id/track_id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    const vid = parseYouTubeId(str(fd, "youtube"));
    if (!vid) return { ok: false, error: "Geçersiz YouTube bağlantısı veya id." };
    const supabase = await createClient();
    const { error } = await supabase.from("lessons").update({
      baslik, youtube_video_id: vid,
      aciklama: str(fd, "aciklama") || null,
      sure_sn: intOrNull(fd, "sure_sn"),
      sira: intOr(fd, "sira", 0),
    }).eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}/${moduleId}`);
    return { ok: true };
  } catch (e) { console.error("updateLesson:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteLesson(id: string, trackId: string, moduleId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}/${moduleId}`);
    return { ok: true };
  } catch (e) { console.error("deleteLesson:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}
