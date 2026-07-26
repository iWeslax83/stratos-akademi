"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
