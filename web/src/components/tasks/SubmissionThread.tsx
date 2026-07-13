"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addSubmissionComment } from "@/app/actions/tasks";
import type { ThreadItem } from "@/lib/tasks/comment";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Görev gönderimi yorum dizisi: kaptan ↔ üye karşılıklı konuşma.
export function SubmissionThread({
  submissionId,
  authorId,
  comments,
}: {
  submissionId: string;
  authorId: string;
  comments: ThreadItem[];
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
      const r = await addSubmissionComment(submissionId, metin, authorId);
      if (!r.ok) { setError(r.error ?? "Hata"); return; }
      setMesaj("");
      router.refresh();
    });
  }

  return (
    <div className="mt-3 border-t border-[var(--line)] pt-3">
      <div className="mb-2 text-xs font-semibold text-muted">Konuşma</div>

      {comments.length === 0 ? (
        <p className="mb-2 text-sm text-muted">Henüz yorum yok. İlk mesajı yaz.</p>
      ) : (
        <ul className="mb-2 space-y-2">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-core bg-black/[0.04] p-3 text-sm text-navy dark:bg-white/[0.04] dark:text-white"
            >
              <div className="mb-0.5 flex items-center gap-2 text-xs">
                <span className="font-semibold">{c.authorAd}</span>
                {!c.authorIsOwner && (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-ink dark:bg-accent-dark dark:text-accent">
                    Kaptan
                  </span>
                )}
                <span className="text-muted">{formatTime(c.created_at)}</span>
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
          placeholder="Mesaj yaz…"
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
    </div>
  );
}
