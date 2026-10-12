"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/actor";
import { getNotifications, type Notification } from "@/lib/notifications/queries";
import { passiveNudgeMessage } from "@/lib/notifications/message";

// Bildirim paneli için: en yeni 20 bildirim. Panel her açılışta çağırır.
export async function listNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const list = await getNotifications(supabase);
  return list.slice(0, 20);
}

export async function markRead(id: string): Promise<{ ok: boolean }> {
  try {
    const supabase = await createClient();
    // RLS: yalnız kendi bildirimini günceller.
    await supabase.from("notifications").update({ okundu: true }).eq("id", id);
    revalidatePath("/bildirimler");
    return { ok: true };
  } catch (e) {
    console.error("markRead:", e);
    return { ok: false };
  }
}

export async function markAllRead(): Promise<{ ok: boolean }> {
  try {
    const supabase = await createClient();
    await supabase.from("notifications").update({ okundu: true }).eq("okundu", false);
    revalidatePath("/bildirimler");
    return { ok: true };
  } catch (e) {
    console.error("markAllRead:", e);
    return { ok: false };
  }
}

export async function sendPassiveNudge(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const gate = await requireAdmin(supabase);
    if (!gate.ok) return { ok: false, error: gate.error };
    // Admin bağlamı → notifications insert politikası is_admin() geçer (announcement/event fan-out'uyla aynı kalıp).
    const { error } = await supabase
      .from("notifications")
      .insert({ user_id: userId, mesaj: passiveNudgeMessage(), link: "/panom" });
    if (error) {
      console.error("sendPassiveNudge:", error);
      return { ok: false, error: "Bildirim gönderilemedi." };
    }
    return { ok: true };
  } catch (e) {
    console.error("sendPassiveNudge:", e);
    return { ok: false, error: "Beklenmeyen hata." };
  }
}

const NUDGE_ALL_LIMIT = 500;

// Tüm pasif üyelere tek seferde dürtme: tek toplu insert, yalnız admin.
export async function sendPassiveNudgeAll(
  userIds: string[],
): Promise<{ ok: boolean; sent?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const gate = await requireAdmin(supabase);
    if (!gate.ok) return { ok: false, error: gate.error };
    const ids = Array.isArray(userIds)
      ? [...new Set(userIds.filter((id): id is string => typeof id === "string" && id.length > 0))]
      : [];
    if (ids.length === 0) return { ok: false, error: "Gönderilecek üye yok." };
    if (ids.length > NUDGE_ALL_LIMIT) return { ok: false, error: "Çok fazla üye seçildi." };
    const mesaj = passiveNudgeMessage();
    const { error } = await supabase
      .from("notifications")
      .insert(ids.map((user_id) => ({ user_id, mesaj, link: "/panom" })));
    if (error) {
      console.error("sendPassiveNudgeAll:", error);
      return { ok: false, error: "Bildirimler gönderilemedi." };
    }
    return { ok: true, sent: ids.length };
  } catch (e) {
    console.error("sendPassiveNudgeAll:", e);
    return { ok: false, error: "Beklenmeyen hata." };
  }
}
