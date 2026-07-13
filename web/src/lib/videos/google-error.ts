// Google API hata gövdesinden okunabilir bir sebep çıkarır (quotaExceeded, keyInvalid…).
// YouTube Data API ve Gemini aynı hata zarfını kullanır.
export async function hataOzeti(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as {
      error?: { message?: string; errors?: { reason?: string }[]; status?: string };
    };
    const reason = body.error?.errors?.[0]?.reason ?? body.error?.status;
    const msg = body.error?.message ?? "";
    return [reason, msg].filter(Boolean).join(" — ").slice(0, 300) || "detay yok";
  } catch {
    return "detay yok";
  }
}
