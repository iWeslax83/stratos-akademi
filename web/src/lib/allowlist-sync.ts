import crypto from "node:crypto";
import { isValidEmail, normalizeEmail } from "@/lib/admin/members";
import { normalizeStudentNo } from "@/lib/student-no";

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

export function parseOkulNo(
  raw: unknown,
): { ok: true; okulNo: string | null } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, okulNo: null };
  const okulNo = normalizeStudentNo(raw);
  if (!okulNo) return { ok: false, error: "Geçersiz okul numarası" };
  return { ok: true, okulNo };
}

// allowlist_student_no_key: aynı numara başka bir e-postaya bağlı (bkz. 0047).
export function isStudentNoConflict(error: { code?: string; message?: string } | null): boolean {
  return error?.code === "23505" && /allowlist_student_no_key/.test(error.message ?? "");
}
