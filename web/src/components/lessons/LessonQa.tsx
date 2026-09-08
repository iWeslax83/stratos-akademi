"use client";

import { useId, useState } from "react";
import { addLessonQuestion, deleteLessonQuestion } from "@/app/actions/lessons";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";
import { canDeleteQa, type QaItem } from "@/lib/lessons/qa";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Ders altı soru-cevap: paylaşılan thread + soru/yanıt yazma + (yazan/admin) silme.
export function LessonQa({
  lessonId,
  viewerId,
  viewerIsAdmin,
  items,
}: {
  lessonId: string;
  viewerId: string;
  viewerIsAdmin: boolean;
  items: QaItem[];
}) {
  const [mesaj, setMesaj] = useState("");
  const inputId = useId();
  const { pending, error, run } = useServerAction("Hata");

  function send() {
    const metin = mesaj.trim();
    if (!metin) return;
    run(() => addLessonQuestion(lessonId, metin), () => setMesaj(""));
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-lg font-bold text-navy dark:text-white">Soru-Cevap</h2>

      {items.length === 0 ? (
        <p className="mb-3 text-sm text-muted">Henüz soru yok. Bu derse dair ilk soruyu sen sor.</p>
      ) : (
        <ul className="mb-3 space-y-2">
          {items.map((c) => (
            <li
              key={c.id}
              className="rounded-core bg-black/[0.04] p-3 text-sm text-navy dark:bg-white/[0.04] dark:text-white"
            >
              <div className="mb-0.5 flex items-center gap-2 text-xs">
                <span className="font-semibold">{c.authorAd}</span>
                {c.authorIsAdmin && (
                  <span className="rounded border border-accent-ink/25 bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-ink dark:border-accent/25 dark:bg-accent-dark dark:text-accent">
                    Kaptan
                  </span>
                )}
                <span className="text-muted">{formatTime(c.created_at)}</span>
                {canDeleteQa(c, viewerId, viewerIsAdmin) && (
                  <span className="ml-auto">
                    <ConfirmButton
                      onConfirm={() => deleteLessonQuestion(c.id)}
                      soru="Bu mesaj silinsin mi?"
                      sade
                    />
                  </span>
                )}
              </div>
              <p className="whitespace-pre-line">{c.mesaj}</p>
            </li>
          ))}
        </ul>
      )}

      <ErrorText>{error}</ErrorText>
      <div className="flex items-end gap-2">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-semibold text-muted">Soru sor ya da yanıtla</span>
          <input
            id={inputId}
            value={mesaj}
            onChange={(e) => setMesaj(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Mesajını yaz, Enter ile gönder…"
            className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-accent dark:text-white"
          />
        </label>
        <button
          type="button"
          onClick={send}
          disabled={pending}
          aria-label="Mesajı gönder"
          className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 dark:bg-white dark:text-navy"
        >
          {pending ? "Gönderiliyor…" : "Gönder"}
        </button>
      </div>
    </section>
  );
}
