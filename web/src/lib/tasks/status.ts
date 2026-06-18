export type SubmissionStatus = "beklemede" | "onay" | "red";

// Gönderim yok (null), beklemede veya red ise üye düzenleyebilir; onay ise kilitli.
export function canEditSubmission(durum: SubmissionStatus | null): boolean {
  return durum !== "onay";
}

export function submissionStatusLabel(durum: SubmissionStatus | null): string {
  switch (durum) {
    case "beklemede":
      return "Beklemede";
    case "onay":
      return "Onaylandı";
    case "red":
      return "Reddedildi";
    default:
      return "Gönderilmedi";
  }
}
