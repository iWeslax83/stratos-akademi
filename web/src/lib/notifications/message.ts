export function taskReviewMessage(durum: "onay" | "red", baslik: string): string {
  return durum === "onay"
    ? `"${baslik}" görevin onaylandı.`
    : `"${baslik}" görevin reddedildi.`;
}
