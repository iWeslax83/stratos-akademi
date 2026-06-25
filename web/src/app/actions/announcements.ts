"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { announcementNotifyMessage } from "@/lib/notifications/message";

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
  revalidatePath("/admin/duyurular");
  revalidatePath("/duyurular");
  revalidatePath("/panom");
}

export async function createAnnouncement(fd: FormData): Promise<ActionResult> {
  try {
    const baslik = str(fd, "baslik");
    const icerik = str(fd, "icerik");
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    if (!icerik) return { ok: false, error: "İçerik zorunlu." };
    const supabase = await createClient();
    // author_id DB'de default auth.uid() ile dolar.
    const { error } = await supabase.from("announcements").insert({ baslik, icerik });
    if (error) return { ok: false, error: errMsg(error) };

    // Tüm üyelere bildirim (admin bağlamı → notifications insert politikası is_admin() geçer). Best-effort.
    try {
      const { data: profs } = await supabase.from("profiles").select("id");
      const rows = ((profs ?? []) as { id: string }[]).map((p) => ({
        user_id: p.id,
        mesaj: announcementNotifyMessage(baslik),
        link: "/duyurular",
      }));
      if (rows.length > 0) await supabase.from("notifications").insert(rows);
    } catch (notifErr) {
      console.error("announcement fan-out:", notifErr);
    }

    bust();
    return { ok: true };
  } catch (e) { console.error("createAnnouncement:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateAnnouncement(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const baslik = str(fd, "baslik");
    const icerik = str(fd, "icerik");
    if (!id) return { ok: false, error: "id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    if (!icerik) return { ok: false, error: "İçerik zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase.from("announcements").update({ baslik, icerik }).eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    bust();
    return { ok: true };
  } catch (e) { console.error("updateAnnouncement:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    bust();
    return { ok: true };
  } catch (e) { console.error("deleteAnnouncement:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}
