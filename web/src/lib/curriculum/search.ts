import type { Curriculum, LessonStatus } from "./types";

// Türkçe duyarlı küçük harf (İ/ı doğru ele alınır).
const norm = (s: string) => s.toLocaleLowerCase("tr");

export type StatusFilter = "all" | "todo" | "done";

/**
 * Müfredatı ders durumuna göre süzer. Hiyerarşi korunur; boş modül/dal düşürülür.
 * "todo" = tamamlanmamış (current + todo), "done" = tamamlanmış, "all" → değişmeden.
 * Durumu bilinmeyen ders "todo" sayılır (güvenli varsayım).
 */
export function filterByStatus(
  curriculum: Curriculum,
  statuses: Record<string, LessonStatus>,
  mode: StatusFilter,
): Curriculum {
  if (mode === "all") return curriculum;
  const keep = (id: string) => {
    const s = statuses[id] ?? "todo";
    return mode === "done" ? s === "done" : s !== "done";
  };

  const result: Curriculum = [];
  for (const track of curriculum) {
    const modules = [];
    for (const mod of track.modules) {
      const lessons = mod.lessons.filter((l) => keep(l.id));
      if (lessons.length > 0) modules.push({ ...mod, lessons });
    }
    if (modules.length > 0) result.push({ ...track, modules });
  }
  return result;
}

/**
 * Müfredatı serbest metinle süzer. Hiyerarşi korunur; boş modül/dal düşürülür.
 * Eşleşme kuralı: dal adı eşleşirse dalın tamamı; modül adı eşleşirse modülün
 * tüm dersleri; aksi halde yalnız başlığı eşleşen dersler. Boş sorgu → değişmeden.
 */
export function filterCurriculum(curriculum: Curriculum, query: string): Curriculum {
  const q = norm(query.trim());
  if (q === "") return curriculum;

  const result: Curriculum = [];
  for (const track of curriculum) {
    if (norm(track.ad).includes(q)) {
      result.push(track);
      continue;
    }
    const modules = [];
    for (const mod of track.modules) {
      if (norm(mod.ad).includes(q)) {
        modules.push(mod);
        continue;
      }
      const lessons = mod.lessons.filter((l) => norm(l.baslik).includes(q));
      if (lessons.length > 0) modules.push({ ...mod, lessons });
    }
    if (modules.length > 0) result.push({ ...track, modules });
  }
  return result;
}
