"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createProductionPorts } from "@/lib/videos/ports";
import { runVideoScan } from "@/lib/videos/scan";
import type { ScanSummary } from "@/lib/videos/types";

export type ActionResult = { ok: boolean; error?: string };

function errMsg(error: { code?: string; message?: string }): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message ?? "")) {
    return "Bu işlem için yetkin yok (admin değilsin).";
  }
  return "İşlem başarısız: " + (error.message ?? "bilinmeyen hata");
}

// Admin bir öneriyi kabul eder → seçilen modüle ders eklenir, öneri approved olur.
export async function kabulEt(id: string, moduleId: string): Promise<ActionResult> {
  try {
    if (!id || !moduleId) return { ok: false, error: "id/modül eksik." };
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Oturum yok." };

    const { data: sug, error: selErr } = await supabase
      .from("video_suggestions")
      .select("youtube_video_id, baslik, aciklama, sure_sn")
      .eq("id", id)
      .single();
    if (selErr || !sug) return { ok: false, error: "Öneri bulunamadı." };

    // Modülün son sıra + 1'i.
    const { data: last } = await supabase
      .from("lessons").select("sira").eq("module_id", moduleId)
      .order("sira", { ascending: false }).limit(1).maybeSingle();
    const sira = ((last?.sira as number | undefined) ?? -1) + 1;

    const { error: insErr } = await supabase.from("lessons").insert({
      module_id: moduleId,
      baslik: sug.baslik,
      youtube_video_id: sug.youtube_video_id,
      aciklama: sug.aciklama ?? null,
      sure_sn: sug.sure_sn ?? null,
      sira,
    });
    if (insErr) return { ok: false, error: errMsg(insErr) };

    const { error: updErr } = await supabase
      .from("video_suggestions")
      .update({ durum: "approved", karar_veren: user.id, karar_at: new Date().toISOString() })
      .eq("id", id);
    if (updErr) return { ok: false, error: errMsg(updErr) };

    revalidatePath("/admin/oneriler");
    revalidatePath("/mufredat");
    return { ok: true };
  } catch (e) { console.error("kabulEt:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function reddet(id: string): Promise<ActionResult> {
  try {
    if (!id) return { ok: false, error: "id eksik." };
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("video_suggestions")
      .update({ durum: "rejected", rejected_at: new Date().toISOString(), karar_veren: user?.id ?? null, karar_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath("/admin/oneriler");
    return { ok: true };
  } catch (e) { console.error("reddet:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function geriGetir(id: string): Promise<ActionResult> {
  try {
    if (!id) return { ok: false, error: "id eksik." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("video_suggestions")
      .update({ durum: "pending", rejected_at: null, karar_veren: null, karar_at: null })
      .eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    revalidatePath("/admin/oneriler");
    return { ok: true };
  } catch (e) { console.error("geriGetir:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// "Şimdi Tara" — admin doğrular, sonra servis istemcisiyle tarama koşar.
export async function taraSimdi(): Promise<ActionResult & { summary?: ScanSummary }> {
  try {
    const supabase = await createClient();
    const { data: isAdmin, error: adminErr } = await supabase.rpc("is_admin");
    if (adminErr) return { ok: false, error: errMsg(adminErr) };
    if (!isAdmin) return { ok: false, error: "Bu işlem için yetkin yok (admin değilsin)." };

    const youtubeKey = process.env.YOUTUBE_API_KEY;
    const geminiKey = process.env.GOOGLE_API_KEY;
    if (!youtubeKey || !geminiKey) return { ok: false, error: "API anahtarları eksik (sunucu)." };

    const svc = createServiceClient();
    const ports = createProductionPorts(svc, { youtubeKey, geminiKey });
    const summary = await runVideoScan(ports);
    revalidatePath("/admin/oneriler");
    return { ok: true, summary };
  } catch (e) { console.error("taraSimdi:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}
