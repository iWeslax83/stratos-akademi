import type { SupabaseClient } from "@supabase/supabase-js";

// Verilen kullanıcının admin olup olmadığını döner (Nav'da "Yönetim" linki için).
export async function isAdminUser(
  supabase: SupabaseClient,
  userId: string | null | undefined,
): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin";
}
