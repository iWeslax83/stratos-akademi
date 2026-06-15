export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAllowed(email: string, allowlist: string[]): boolean {
  const e = normalizeEmail(email);
  return allowlist.some((a) => normalizeEmail(a) === e);
}
