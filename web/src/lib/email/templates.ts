// Saf e-posta şablonu (test edilebilir). Görev inceleme bildirimi.
export function taskReviewEmail(
  durum: "onay" | "red",
  baslik: string,
  link: string,
): { subject: string; html: string } {
  const onay = durum === "onay";
  const subject = onay ? `Görevin onaylandı: ${baslik}` : `Görevin reddedildi: ${baslik}`;
  const durumMetni = onay
    ? `<strong>&quot;${baslik}&quot;</strong> pratik görevin <strong style="color:#1f7a3d">onaylandı</strong>. Tebrikler!`
    : `<strong>&quot;${baslik}&quot;</strong> pratik görevin <strong style="color:#c0392b">reddedildi</strong>. Geri bildirimi okuyup tekrar gönderebilirsin.`;
  const html = `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#16243f">
  <h2 style="font-size:18px;margin:0 0 12px">Stratos Akademi</h2>
  <p style="font-size:15px;line-height:1.5;margin:0 0 20px">${durumMetni}</p>
  <a href="${link}" style="display:inline-block;background:#16243f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:600;font-size:14px">Görevi gör</a>
</div>`;
  return { subject, html };
}
