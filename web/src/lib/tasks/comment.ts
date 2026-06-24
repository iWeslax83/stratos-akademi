// Görev gönderimi yorum dizisi (thread) için saf yardımcılar. DB I/O yok; test edilebilir.

export type CommentRow = {
  id: string;
  submission_id: string;
  author_id: string;
  mesaj: string;
  created_at: string;
};

export type ThreadItem = {
  id: string;
  mesaj: string;
  created_at: string;
  authorAd: string;
  /** Yorumu yazan, gönderimin sahibi (üye) mi? false ise kaptan. */
  authorIsOwner: boolean;
};

// Yorum metnini temizler (baştaki/sondaki boşluk).
export function cleanComment(raw: string | null | undefined): string {
  return (raw ?? "").trim();
}

// Yeni yorumda kime bildirim gidecek? Kaptan yazdıysa → gönderim sahibine;
// üye yazdıysa → son inceleyen kaptana (varsa). Kendine bildirim yok.
export function commentNotifyTarget(args: {
  authorId: string;
  authorIsAdmin: boolean;
  submissionOwnerId: string;
  reviewedBy: string | null;
}): string | null {
  if (args.authorIsAdmin) {
    return args.submissionOwnerId !== args.authorId ? args.submissionOwnerId : null;
  }
  return args.reviewedBy && args.reviewedBy !== args.authorId ? args.reviewedBy : null;
}

// Ham yorum satırlarını submission_id'ye göre gruplar, sahiplik etiketi ve ad ekler,
// her grubu created_at'e göre artan sıralar. Bilinmeyen ad/sahip için güvenli fallback.
export function groupThreads(
  rows: CommentRow[],
  ownerById: Map<string, string>,
  nameById: Map<string, string>,
): Map<string, ThreadItem[]> {
  const map = new Map<string, ThreadItem[]>();
  for (const r of rows) {
    const owner = ownerById.get(r.submission_id);
    const item: ThreadItem = {
      id: r.id,
      mesaj: r.mesaj,
      created_at: r.created_at,
      authorAd: nameById.get(r.author_id) ?? "Üye",
      authorIsOwner: owner != null && r.author_id === owner,
    };
    const arr = map.get(r.submission_id) ?? [];
    arr.push(item);
    map.set(r.submission_id, arr);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0));
  }
  return map;
}
