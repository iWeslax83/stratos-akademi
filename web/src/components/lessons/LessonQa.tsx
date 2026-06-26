"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addLessonQuestion, deleteLessonQuestion } from "@/app/actions/lessons";
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
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function send() {
    const metin = mesaj.trim();
    if (!metin) return;
    setError(null);
    start(async () => {
      const r = await addLessonQuestion(lessonId, metin, viewerId);
      if (!r.ok) { setError(r.error ?? "Hata"); return; }
      setMesaj("");
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!window.confirm("Bu mesajı silmek istediğine emin misin?")) return;
    start(async () => {
      const r = await deleteLessonQuestion(id);
      if (!r.ok) { window.alert(r.error ?? "Silinemedi"); return; }
      router.refresh();
    });
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
                  <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-[#8a6d12] dark:bg-gold-dark dark:text-[#ffd54a]">
                    Kaptan
                  </span>
                )}
                <span className="text-muted">{formatTime(c.created_at)}</span>
                {canDeleteQa(c, viewerId, viewerIsAdmin) && (
                  <button
                    onClick={() => remove(c.id)}
                    disabled={pending}
                    className="ml-auto text-muted hover:text-red-600 disabled:opacity-50"
                    aria-label="Sil"
                  >
                    Sil
                  </button>
                )}
              </div>
              <p className="whitespace-pre-line">{c.mesaj}</p>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mb-1 text-sm font-semibold text-red-600">{error}</p>}
      <div className="flex gap-2">
        <input
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          placeholder="Soru sor ya da yanıtla…"
          className="flex-1 rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
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
