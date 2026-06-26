// Ders altı soru-cevap için saf yardımcılar. DB I/O yok; test edilebilir.

export type QaRow = {
  id: string;
  lesson_id: string;
  author_id: string;
  mesaj: string;
  created_at: string;
};

export type QaItem = {
  id: string;
  authorId: string;
  mesaj: string;
  created_at: string;
  authorAd: string;
  authorIsAdmin: boolean;
};

// Ham satırları ad + admin etiketiyle zenginleştirir, created_at'e göre artan sıralar.
export function buildLessonThread(
  rows: QaRow[],
  nameById: Map<string, string>,
  adminIds: Set<string>,
): QaItem[] {
  return rows
    .map((r) => ({
      id: r.id,
      authorId: r.author_id,
      mesaj: r.mesaj,
      created_at: r.created_at,
      authorAd: nameById.get(r.author_id) ?? "Üye",
      authorIsAdmin: adminIds.has(r.author_id),
    }))
    .sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0));
}

// Bir öğenin silinebilirliği: yazan ya da admin (RLS de zorlar; bu yalnız UI içindir).
export function canDeleteQa(item: { authorId: string }, viewerId: string, viewerIsAdmin: boolean): boolean {
  return item.authorId === viewerId || viewerIsAdmin;
}
