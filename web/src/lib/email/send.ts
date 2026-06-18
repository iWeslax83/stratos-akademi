// Resend REST API ile e-posta gönderimi (ek bağımlılık yok). Yalnız sunucu.
// RESEND_API_KEY / MAIL_FROM yoksa sessizce atlanır (graceful).
export async function sendEmail(mail: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) return { ok: false, skipped: true };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: mail.to, subject: mail.subject, html: mail.html }),
    });
    if (!res.ok) {
      console.error("Resend hata:", res.status, await res.text());
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("sendEmail:", e);
    return { ok: false, error: "ağ hatası" };
  }
}
