"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorText } from "./ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";

const tehlikeCls =
  "rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50";
const onayCls =
  "rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50";
const sadeCls = "text-muted transition-colors hover:text-red-600 disabled:opacity-50";
const vazgecCls =
  "rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-black/10 disabled:opacity-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20";

// Yıkıcı işlemler için satır içi onay: tarayıcının window.confirm kutusu yerine
// düğme, sorunun kendisine dönüşür. Esc ya da "Vazgeç" geri alır.
export function ConfirmButton({
  onConfirm,
  soru,
  label = "Sil",
  onayLabel = "Evet, sil",
  sade = false,
}: {
  onConfirm: () => Promise<{ ok: boolean; error?: string }>;
  soru: string;
  label?: string;
  onayLabel?: string;
  // sade: kırmızı hap yerine ince metin düğmesi (ör. mesaj başlığı içinde).
  sade?: boolean;
}) {
  const [soruluyor, setSoruluyor] = useState(false);
  const { pending, error, run } = useServerAction("Silinemedi");
  const onayRef = useRef<HTMLButtonElement>(null);

  // Soru açılınca odak onay düğmesine geçer: klavyeyle de onaylanabilir.
  useEffect(() => {
    if (soruluyor) onayRef.current?.focus();
  }, [soruluyor]);

  if (!soruluyor) {
    return (
      <span>
        <button
          type="button"
          onClick={() => setSoruluyor(true)}
          className={sade ? sadeCls : tehlikeCls}
        >
          {label}
        </button>
        <ErrorText>{error}</ErrorText>
      </span>
    );
  }

  return (
    <span
      role="group"
      aria-label={soru}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !pending) setSoruluyor(false);
      }}
      className="inline-flex flex-wrap items-center gap-2"
    >
      <span className="text-xs font-semibold text-navy dark:text-white">{soru}</span>
      <button
        ref={onayRef}
        type="button"
        disabled={pending}
        onClick={() => run(onConfirm)}
        className={onayCls}
      >
        {pending ? "…" : onayLabel}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setSoruluyor(false)}
        className={vazgecCls}
      >
        Vazgeç
      </button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}
