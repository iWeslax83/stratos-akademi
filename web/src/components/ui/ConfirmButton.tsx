"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorText } from "./ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";
import { smallButtonClasses } from "@/components/ui/Button";

const tehlikeCls = smallButtonClasses("danger");
const onayCls = smallButtonClasses("dangerSolid");
const sadeCls = "text-muted transition-colors hover:text-red-600 disabled:opacity-50";
const vazgecCls = smallButtonClasses("ghost");

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
      <span className="text-xs font-semibold text-fg">{soru}</span>
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
