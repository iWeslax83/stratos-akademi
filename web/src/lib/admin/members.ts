export type Role = "uye" | "admin";
export type AllowlistRow = { email: string; role: Role; created_at: string };
export type MemberRow = { id: string; email: string; ad: string | null; role: Role; created_at: string };

export function normalizeEmail(s: string): string {
  return (s ?? "").trim().toLowerCase();
}

export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Allowlist'te olup eşleşen profili (email) olmayan davetler.
export function pendingInvites(allowlist: AllowlistRow[], members: MemberRow[]): AllowlistRow[] {
  const memberEmails = new Set(members.map((m) => m.email.toLowerCase()));
  return allowlist.filter((a) => !memberEmails.has(a.email.toLowerCase()));
}
