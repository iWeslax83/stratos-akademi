"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cleanDisplayName } from "@/lib/profile/displayName";

export type ActionResult = { ok: boolean; error?: string };

// Üyenin kendi görünen adını (profiles.ad) günceller. user_id parametre olarak gelir;
// RLS (auth.uid() = id) başkasının satırını güncellemeyi engeller (yanlış id → 0 satır).
// role kolonu 0021 trigger'ı ile korunur; burada yalnız `ad` yazılır.
export async function updateDisplayName(userId: string, ad: string): Promise<ActionResult> {
  try {
    const c = cleanDisplayName(ad);
    if (!c.ok) return { ok: false, error: c.error };
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").update({ ad: c.value }).eq("id", userId);
    if (error) {
      console.error("updateDisplayName:", error);
      return { ok: false, error: "Ad güncellenemedi." };
    }
    revalidatePath("/profil");
    revalidatePath("/panom");
    return { ok: true };
  } catch (e) {
    console.error("updateDisplayName beklenmeyen hata:", e);
    return { ok: false, error: "Beklenmeyen hata." };
  }
}
