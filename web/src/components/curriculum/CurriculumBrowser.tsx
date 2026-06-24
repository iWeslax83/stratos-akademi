"use client";

import { useMemo, useState } from "react";
import { CurriculumTree } from "./CurriculumTree";
import { filterCurriculum } from "@/lib/curriculum/search";
import type { Curriculum, LessonStatus } from "@/lib/curriculum/types";

export function CurriculumBrowser({
  curriculum,
  statuses,
}: {
  curriculum: Curriculum;
  statuses: Record<string, LessonStatus>;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => filterCurriculum(curriculum, q), [curriculum, q]);
  const statusMap = useMemo(() => new Map(Object.entries(statuses)), [statuses]);
  const sonuc = filtered.reduce(
    (n, t) => n + t.modules.reduce((m, mod) => m + mod.lessons.length, 0),
    0,
  );
  const aranıyor = q.trim() !== "";

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ders, modül veya dal ara…"
        aria-label="Müfredatta ara"
        className="mb-4 w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-gold dark:text-white"
      />
      {aranıyor && (
        <p className="mb-3 text-xs font-semibold text-muted">
          {sonuc} ders bulundu
        </p>
      )}
      {aranıyor && filtered.length === 0 ? (
        <p className="text-sm text-muted">
          “{q.trim()}” için sonuç yok.
        </p>
      ) : (
        <CurriculumTree curriculum={filtered} statuses={statusMap} activeLessonId={null} />
      )}
    </div>
  );
}
