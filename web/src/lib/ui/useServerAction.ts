"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Result = { ok: boolean; error?: string };

// Sunucu aksiyonlarının ortak sarmalayıcısı: bekleme durumu, satır içi hata
// ve başarıda router.refresh(). Hata window.alert yerine ErrorText ile gösterilir.
export function useServerAction(fallback = "İşlem başarısız") {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run(action: () => Promise<Result>, onSuccess?: () => void) {
    setError(null);
    start(async () => {
      const r = await action();
      if (!r.ok) {
        setError(r.error ?? fallback);
        return;
      }
      onSuccess?.();
      router.refresh();
    });
  }

  return { pending, error, run };
}
