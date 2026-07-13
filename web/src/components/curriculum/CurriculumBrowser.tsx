"use client";

import { useMemo, useState } from "react";
import { CurriculumTree } from "./CurriculumTree";
import { filterCurriculum, filterByStatus, type StatusFilter } from "@/lib/curriculum/search";
import type { Curriculum, LessonStatus } from "@/lib/curriculum/types";

const MODLAR: { key: StatusFilter; etiket: string }[] = [
  { key: "all", etiket: "Tümü" },
  { key: "todo", etiket: "Kalanlar" },
  { key: "done", etiket: "Tamamlananlar" },
];

export function CurriculumBrowser({
  curriculum,
  statuses,
}: {
  curriculum: Curriculum;
  statuses: Record<string, LessonStatus>;
}) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<StatusFilter>("all");

  // Önce metin, sonra durum süzgeci (ikisi de hiyerarşiyi korur).
  const filtered = useMemo(
    () => filterByStatus(filterCurriculum(curriculum, q), statuses, mode),
    [curriculum, q, statuses, mode],
  );
  const statusMap = useMemo(() => new Map(Object.entries(statuses)), [statuses]);
  const sonuc = filtered.reduce(
    (n, t) => n + t.modules.reduce((m, mod) => m + mod.lessons.length, 0),
    0,
  );
  const suzuluyor = q.trim() !== "" || mode !== "all";

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ders, modül veya dal ara…"
          aria-label="Müfredatta ara"
          className="w-full flex-1 rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-accent dark:text-white"
        />
        <div className="flex shrink-0 rounded-full border border-[var(--line)] p-0.5" role="tablist" aria-label="Duruma göre süz">
          {MODLAR.map((m) => (
            <button
              key={m.key}
              role="tab"
              aria-selected={mode === m.key}
              onClick={() => setMode(m.key)}
              className={
                mode === m.key
                  ? "rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white dark:bg-accent dark:text-navy"
                  : "rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:text-navy dark:hover:text-white"
              }
            >
              {m.etiket}
            </button>
          ))}
        </div>
      </div>

      {suzuluyor && <p className="mb-3 text-xs font-semibold text-muted">{sonuc} ders bulundu</p>}

      {suzuluyor && filtered.length === 0 ? (
        <p className="text-sm text-muted">
          {mode === "done"
            ? "Henüz tamamlanmış ders yok."
            : mode === "todo" && q.trim() === ""
              ? "Tüm dersleri tamamladın."
              : `“${q.trim()}” için sonuç yok.`}
        </p>
      ) : (
        <CurriculumTree curriculum={filtered} statuses={statusMap} activeLessonId={null} />
      )}
    </div>
  );
}
