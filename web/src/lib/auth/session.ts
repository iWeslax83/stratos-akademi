import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string | null };

// Oturumdaki kullanıcı: JWT imzası asimetrik anahtarla YEREL doğrulanır (ağ isteği yok).
// getUser() her çağrıda Auth sunucusuna gider; proxy + sayfa + Nav ile üç kez ödeniyordu.
// Süresi dolmuş token'ı proxy.ts yeniler; buraya yenilenmiş çerezle gelinir.
// İstek başına tek doğrulama (React cache). Yazma yetkisi gereken yerler actorId/requireAdmin kullanır.
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (error || !sub) return null;
  const email = data.claims.email;
  return { id: sub, email: typeof email === "string" ? email : null };
});
