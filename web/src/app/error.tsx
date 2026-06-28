"use client"; // Hata sınırları Client Component olmalı.

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

// Bir route segmentinde beklenmedik runtime hatası olursa gösterilir (Next 16: unstable_retry).
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[1180px] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-6xl font-extrabold text-gold-ink dark:text-gold">Hata</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-navy dark:text-white">
        Bir şeyler ters gitti
      </h1>
      <p className="mt-2 text-muted">
        Bu sayfa yüklenirken beklenmeyen bir hata oluştu. Tekrar deneyebilirsin.
      </p>
      <Button variant="gold" className="mt-6" onClick={() => unstable_retry()}>
        Tekrar dene
      </Button>
    </div>
  );
}
