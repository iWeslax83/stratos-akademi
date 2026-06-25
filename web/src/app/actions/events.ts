"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { eventNotifyMessage } from "@/lib/notifications/message";

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
  revalidatePath("/admin/etkinlikler");
  revalidatePath("/etkinlikler");
  revalidatePath("/panom");
}

export async function createEvent(fd: FormData): Promise<ActionResult> {
  try {
    const baslik = str(fd, "baslik");
    const baslangic = str(fd, "baslangic");
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    if (!baslangic) return { ok: false, error: "Tarih/saat zorunlu." };
    const supabase = await createClient();
    // author_id DB'de default auth.uid() ile dolar.
    const { error } = await supabase.from("events").insert({
      baslik,
      baslangic,
      aciklama: str(fd, "aciklama") || null,
      yer: str(fd, "yer") || null,
    });
    if (error) return { ok: false, error: errMsg(error) };

    // Tüm üyelere bildirim (admin bağlamı → notifications insert politikası is_admin() geçer). Best-effort.
    try {
      const { data: profs } = await supabase.from("profiles").select("id");
      const rows = ((profs ?? []) as { id: string }[]).map((p) => ({
        user_id: p.id,
        mesaj: eventNotifyMessage(baslik),
        link: "/etkinlikler",
      }));
      if (rows.length > 0) await supabase.from("notifications").insert(rows);
    } catch (notifErr) {
      console.error("event fan-out:", notifErr);
    }

    bust();
    return { ok: true };
  } catch (e) { console.error("createEvent:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateEvent(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const baslik = str(fd, "baslik");
    const baslangic = str(fd, "baslangic");
    if (!id) return { ok: false, error: "id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    if (!baslangic) return { ok: false, error: "Tarih/saat zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("events")
      .update({ baslik, baslangic, aciklama: str(fd, "aciklama") || null, yer: str(fd, "yer") || null })
      .eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    bust();
    return { ok: true };
  } catch (e) { console.error("updateEvent:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    bust();
    return { ok: true };
  } catch (e) { console.error("deleteEvent:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}
