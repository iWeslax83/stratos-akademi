"use client";

import { useState } from "react";
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
  const { pending, error, run } = useServerAction("Hata");

  function send() {
    const metin = mesaj.trim();
    if (!metin) return;
    run(() => addLessonQuestion(lessonId, metin, viewerId), () => setMesaj(""));
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
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-ink dark:bg-accent-dark dark:text-accent">
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
      <div className="flex gap-2">
        <input
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          placeholder="Soru sor ya da yanıtla…"
          className="flex-1 rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-accent dark:text-white"
        />
        <button
          onClick={send}
          disabled={pending}
          className="rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-navy"
        >
          {pending ? "…" : "Gönder"}
        </button>
      </div>
    </section>
  );
}
