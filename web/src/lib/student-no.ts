// Okul numarası yalnız rakam, 1-10 hane. Başa eklenen sıfır anlamlıdır ("0123" != "123").
export const STUDENT_NO_RE = /^\d{1,10}$/;

export function normalizeStudentNo(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim();
  return STUDENT_NO_RE.test(v) ? v : null;
}
