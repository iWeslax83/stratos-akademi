// Tam YouTube URL'lerinden 11-hane video id çıkarır; zaten geçerli 11-hane id ise
// olduğu gibi döner; aksi halde null.
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeId(input: string): string | null {
  const s = (input ?? "").trim();
  if (!s) return null;
  if (ID_RE.test(s)) return s;
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}

export type YouTubeInput =
  | { tur: "video"; id: string; playlistId?: string }
  | { tur: "playlist"; id: string };

const LIST_RE = /[?&]list=([A-Za-z0-9_-]+)/;

// YouTube Mix (RD...), izleme listesi (WL) ve beğenilenler (LL) API'den okunamaz.
function usablePlaylist(id: string): boolean {
  return !/^RD/.test(id) && id !== "WL" && id !== "LL";
}

// Yönetici girdisini video ya da playlist olarak sınıflar. v= ile list= birlikteyse
// (playlist içinden açılmış video) video sayılır ve playlistId taşınır.
export function parseYouTubeInput(input: string): YouTubeInput | null {
  const s = (input ?? "").trim();
  if (!s) return null;
  const listId = LIST_RE.exec(s)?.[1];
  const playlistId = listId && usablePlaylist(listId) ? listId : undefined;
  const id = parseYouTubeId(s);
  if (id) return playlistId ? { tur: "video", id, playlistId } : { tur: "video", id };
  if (playlistId) return { tur: "playlist", id: playlistId };
  return null;
}
