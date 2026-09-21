import type { SupabaseClient } from "@supabase/supabase-js";

// Sunucu aksiyonlarında çağıranın kimliğini / yetkisini BELİRLER, istemciden gelen
// userId/selfId/adminId parametrelerine ASLA güvenilmez (forge edilebilir).
//
// Kimlik: önce my_uid() RPC (JWT'den auth.uid(), oturum yenilemesi tetiklemez, bkz. 0022),
// o yoksa getUser()'a düşer. Yetki: is_admin() RPC (0010; SECURITY DEFINER, RLS özyinelemesiz).

export async function actorId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.rpc("my_uid");
  if (!error && typeof data === "string" && data) return data;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export type AdminGate = { ok: true } | { ok: false; error: string };

export async function requireAdmin(supabase: SupabaseClient): Promise<AdminGate> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return { ok: false, error: "Yetki doğrulanamadı." };
  if (data !== true) return { ok: false, error: "Bu işlem için yetkin yok (admin değilsin)." };
  return { ok: true };
}
