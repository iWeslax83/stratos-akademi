import type { Curriculum } from "./types";

// Türkçe duyarlı küçük harf (İ/ı doğru ele alınır).
const norm = (s: string) => s.toLocaleLowerCase("tr");

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
