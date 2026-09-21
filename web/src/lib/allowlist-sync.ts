import crypto from "node:crypto";
import { isValidEmail, normalizeEmail } from "@/lib/admin/members";

// Stratos sitesinden gelen çağrıları doğrular. Token yoksa ya da kısaysa
// her istek reddedilir (yanlış yapılandırma kapıyı açık bırakmasın).
export function checkSyncToken(header: string | null, expected: string | undefined): boolean {
  if (!expected || expected.length < 16) return false;
  const match = /^Bearer (.+)$/.exec(header ?? "");
  if (!match) return false;
  const a = Buffer.from(match[1]);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function parseAllowlistEmail(
  raw: unknown,
): { ok: true; email: string } | { ok: false; error: string } {
  const email = typeof raw === "string" ? normalizeEmail(raw) : "";
  if (!email || email.length > 254 || !isValidEmail(email)) {
    return { ok: false, error: "Geçersiz e-posta" };
  }
  return { ok: true, email };
}
