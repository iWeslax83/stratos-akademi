"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
