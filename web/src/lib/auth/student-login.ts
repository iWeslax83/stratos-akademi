import type { SupabaseClient } from "@supabase/supabase-js";

export const RATE_WINDOW_MS = 15 * 60_000;
export const RATE_PER_IP = 10;
export const RATE_PER_NO = 5;

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Vercel gerçek istemci IP'sini x-forwarded-for'un ilk değerine koyar.
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || headers.get("x-real-ip")?.trim() || "unknown";
}

// Fail-closed: secret yok, token bozuk, ağ/HTTP/JSON hatası, hepsi false. Asla fırlatmaz.
export async function verifyTurnstile(
  token: unknown,
  ip: string,
  secret: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (!secret) return false;
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip !== "unknown") body.set("remoteip", ip);
    const res = await fetchImpl(SITEVERIFY, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { success?: unknown };
    return json.success === true;
  } catch {
    return false;
  }
}

// Önce sınırı kontrol eder, sınır altındaysa bu denemeyi kaydeder. Sayım/ekleme hatasında
// "error" döner (kapı açık kalmasın). Eski kayıtlar fırsat buldukça silinir.
export async function consumeAttempt(
  svc: SupabaseClient,
  ip: string,
  studentNo: string,
  now: number = Date.now(),
): Promise<"ok" | "limited" | "error"> {
  const since = new Date(now - RATE_WINDOW_MS).toISOString();
  const table = () => svc.from("student_login_attempts");

  const byIp = await table().select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", since);
  const byNo = await table().select("id", { count: "exact", head: true }).eq("student_no", studentNo).gte("created_at", since);
  if (byIp.error || byNo.error) return "error";
  if ((byIp.count ?? 0) >= RATE_PER_IP || (byNo.count ?? 0) >= RATE_PER_NO) return "limited";

  const { error } = await table().insert({ ip, student_no: studentNo });
  if (error) return "error";

  // Temizlik başarısız olursa giriş etkilenmez.
  await table()
    .delete()
    .lt("created_at", new Date(now - 24 * 60 * 60_000).toISOString())
    .then(undefined, () => undefined);
  return "ok";
}
