export function taskReviewMessage(durum: "onay" | "red", baslik: string): string {
  return durum === "onay"
    ? `"${baslik}" görevin onaylandı.`
    : `"${baslik}" görevin reddedildi.`;
}

// Görev gönderimine yeni yorum yazıldığında karşı tarafa giden bildirim.
export function submissionCommentMessage(baslik: string, fromAdmin: boolean): string {
  return fromAdmin
    ? `"${baslik}" görevine kaptan yorum yaptı.`
    : `"${baslik}" görevine üye yanıt yazdı.`;
}

// Yeni duyuru yayınlandığında tüm üyelere giden bildirim.
export function announcementNotifyMessage(baslik: string): string {
  return `Yeni duyuru: "${baslik}"`;
}

// Yeni etkinlik eklendiğinde tüm üyelere giden bildirim.
export function eventNotifyMessage(baslik: string): string {
  return `Yeni etkinlik: "${baslik}"`;
}
