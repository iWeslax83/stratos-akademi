"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getNotifications, type Notification } from "@/lib/notifications/queries";

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
