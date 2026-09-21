"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/actor";
import { parseYouTubeId } from "@/lib/admin/youtube";
import { hazirlaSure } from "@/lib/lessons/server";
import { moveOrder } from "@/lib/lessons/order";

export type ActionResult = { ok: boolean; error?: string };

function str(fd: FormData, k: string): string {
  return ((fd.get(k) as string | null) ?? "").trim();
}
function intOr(fd: FormData, k: string, def: number): number {
  const v = parseInt(str(fd, k), 10);
  return Number.isFinite(v) ? v : def;
}
function errMsg(error: { code?: string; message?: string }): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message ?? "")) {
    return "Bu işlem için yetkin yok (admin değilsin).";
  }
  return "İşlem başarısız: " + (error.message ?? "bilinmeyen hata");
}

// RLS admin politikaları zaten yazmayı kısıtlar; server action bir POST uç noktası
// olduğundan (sayfa değil) her aksiyonda ayrıca is_admin() ile ikinci kapı konur.
async function guard() {
  const supabase = await createClient();
  const gate = await requireAdmin(supabase);
  return { supabase, gate };
}

// ---- TRACK ----
export async function createTrack(fd: FormData): Promise<ActionResult> {
  try {
    const { supabase, gate } = await guard();
    if (!gate.ok) return { ok: false, error: gate.error };
    const ad = str(fd, "ad");
    const slug = str(fd, "slug");
    if (!ad || !slug) return { ok: false, error: "Ad ve slug zorunlu." };
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
    const { supabase, gate } = await guard();
    if (!gate.ok) return { ok: false, error: gate.error };
    const id = str(fd, "id");
    const ad = str(fd, "ad");
    const slug = str(fd, "slug");
    if (!id) return { ok: false, error: "id eksik." };
    if (!ad || !slug) return { ok: false, error: "Ad ve slug zorunlu." };
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
    const { supabase, gate } = await guard();
    if (!gate.ok) return { ok: false, error: gate.error };
    const { error } = await supabase.from("tracks").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath("/admin/mufredat");
    return { ok: true };
  } catch (e) { console.error("deleteTrack:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- MODULE ----
export async function createModule(fd: FormData): Promise<ActionResult> {
  try {
    const { supabase, gate } = await guard();
    if (!gate.ok) return { ok: false, error: gate.error };
    const trackId = str(fd, "track_id");
    const ad = str(fd, "ad");
    if (!trackId) return { ok: false, error: "track_id eksik." };
    if (!ad) return { ok: false, error: "Ad zorunlu." };
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
    const { supabase, gate } = await guard();
    if (!gate.ok) return { ok: false, error: gate.error };
    const id = str(fd, "id");
    const trackId = str(fd, "track_id");
    const ad = str(fd, "ad");
    if (!id || !trackId) return { ok: false, error: "id/track_id eksik." };
    if (!ad) return { ok: false, error: "Ad zorunlu." };
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
    const { supabase, gate } = await guard();
    if (!gate.ok) return { ok: false, error: gate.error };
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}`);
    return { ok: true };
  } catch (e) { console.error("deleteModule:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- LESSON ----
// Ders ekleme artık lesson-add.ts içinde (onizle + addLessonsFromVideos). Burada yalnız
// düzenleme var: süre elle girilmez, video değişirse YouTube'dan yeniden alınır.
export async function updateLesson(fd: FormData): Promise<ActionResult> {
  try {
    const { supabase, gate } = await guard();
    if (!gate.ok) return { ok: false, error: gate.error };
    const id = str(fd, "id");
    const moduleId = str(fd, "module_id");
    const trackId = str(fd, "track_id");
    const baslik = str(fd, "baslik");
    if (!id || !moduleId || !trackId) return { ok: false, error: "id/module_id/track_id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    const vid = parseYouTubeId(str(fd, "youtube"));
    if (!vid) return { ok: false, error: "Geçersiz YouTube bağlantısı veya id." };

    const { data: mevcut } = await supabase
      .from("lessons").select("youtube_video_id").eq("id", id).maybeSingle();
    if (!mevcut) return { ok: false, error: "Ders bulunamadı." };

    const patch: { baslik: string; youtube_video_id: string; aciklama: string | null; sure_sn?: number } = {
      baslik, youtube_video_id: vid, aciklama: str(fd, "aciklama") || null,
    };
    if (mevcut.youtube_video_id !== vid) {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) return { ok: false, error: "YOUTUBE_API_KEY tanımlı değil." };
      const r = await hazirlaSure(supabase, { moduleId, videoId: vid, apiKey, kendiKaydi: false });
      if (!r.ok) return { ok: false, error: r.error };
      patch.sure_sn = r.sure_sn;
    }
    const { error } = await supabase.from("lessons").update(patch).eq("id", id);
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Bu video modülde zaten var." };
      return { ok: false, error: errMsg(error) };
    }
    revalidatePath(`/admin/mufredat/${trackId}/${moduleId}`);
    return { ok: true };
  } catch (e) { console.error("updateLesson:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// Süreyi YouTube'dan yeniden okur (video değişmedi ama süre sonradan düzeltilmiş olabilir).
export async function refreshLessonDuration(id: string, trackId: string, moduleId: string): Promise<ActionResult> {
  try {
    const { supabase, gate } = await guard();
    if (!gate.ok) return { ok: false, error: gate.error };
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return { ok: false, error: "YOUTUBE_API_KEY tanımlı değil." };
    const { data: ders } = await supabase
      .from("lessons").select("module_id, youtube_video_id").eq("id", id).maybeSingle();
    if (!ders) return { ok: false, error: "Ders bulunamadı." };
    const r = await hazirlaSure(supabase, {
      moduleId: ders.module_id as string, videoId: ders.youtube_video_id as string, apiKey, kendiKaydi: true,
    });
    if (!r.ok) return { ok: false, error: r.error };
    const { error } = await supabase.from("lessons").update({ sure_sn: r.sure_sn }).eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}/${moduleId}`);
    return { ok: true };
  } catch (e) { console.error("refreshLessonDuration:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// Dersi bir basamak yukarı/aşağı taşır. Modülün sırası 0..n-1 olarak yeniden numaralanır.
export async function moveLesson(id: string, yon: "yukari" | "asagi", trackId: string): Promise<ActionResult> {
  try {
    const { supabase, gate } = await guard();
    if (!gate.ok) return { ok: false, error: gate.error };
    const { data: ders } = await supabase.from("lessons").select("module_id").eq("id", id).maybeSingle();
    if (!ders) return { ok: false, error: "Ders bulunamadı." };
    const moduleId = ders.module_id as string;
    const { data: rows, error: selErr } = await supabase
      .from("lessons").select("id, sira").eq("module_id", moduleId);
    if (selErr) return { ok: false, error: errMsg(selErr) };

    const degisen = moveOrder((rows ?? []) as { id: string; sira: number }[], id, yon);
    const sonuclar = await Promise.all(
      degisen.map((r) => supabase.from("lessons").update({ sira: r.sira }).eq("id", r.id)),
    );
    const hata = sonuclar.find((r) => r.error)?.error;
    if (hata) return { ok: false, error: errMsg(hata) };
    revalidatePath(`/admin/mufredat/${trackId}/${moduleId}`);
    revalidatePath("/mufredat");
    return { ok: true };
  } catch (e) { console.error("moveLesson:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteLesson(id: string, trackId: string, moduleId: string): Promise<ActionResult> {
  try {
    const { supabase, gate } = await guard();
    if (!gate.ok) return { ok: false, error: gate.error };
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath(`/admin/mufredat/${trackId}/${moduleId}`);
    return { ok: true };
  } catch (e) { console.error("deleteLesson:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}
