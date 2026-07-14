"use client";

import { ConfirmButton } from "@/components/ui/ConfirmButton";

// Yıkıcı silme işlemleri: onay artık satır içinde sorulur (window.confirm değil).
export function DeleteButton({
  onDelete,
  uyari,
}: {
  onDelete: () => Promise<{ ok: boolean; error?: string }>;
  uyari: string;
}) {
  return <ConfirmButton onConfirm={onDelete} soru={uyari} />;
}
