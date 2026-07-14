import { cache } from "react";

// Fotoğraflar stratosiha.com'un içerik reposundan gelir: site admin panelinden
// (/admin/takim) yüklenen foto site.json'a yazılıp repoya commit edilir.
// JSON ve görseli aynı commit'ten okuyoruz — sitenin yeniden deploy olmasını
// beklemeden tutarlı kalsın diye.
const RAW = "https://raw.githubusercontent.com/iWeslax83/stratos-website/main";
const SITE_JSON = `${RAW}/src/content/site.json`;
const REVALIDATE_SN = 3600;

type Named = { name?: unknown; photo?: unknown };

/** İsmi eşleştirme anahtarına çevirir: aksan, şapka, büyük/küçük ve fazla boşluk farkını siler. */
export function normalizeName(input: string): string {
  return (input ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // U+0300–U+036F: birleşik aksan işaretleri
    .replace(/[İIı]/g, "i")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function add(map: Map<string, string>, entry: unknown) {
  const { name, photo } = (entry ?? {}) as Named;
  if (typeof name !== "string" || typeof photo !== "string" || !photo) return;
  map.set(normalizeName(name), `${RAW}/public${photo.startsWith("/") ? photo : `/${photo}`}`);
}

/** site.json içeriğinden `normalize edilmiş isim → mutlak foto URL` haritası kurar. */
export function buildPhotoMap(site: unknown): Map<string, string> {
  const map = new Map<string, string>();
  const team = (site as { team?: { advisor?: unknown; members?: unknown } } | null)?.team;
  if (!team) return map;
  add(map, team.advisor);
  if (Array.isArray(team.members)) team.members.forEach((m) => add(map, m));
  return map;
}

/** Siteden haritayı çeker. Herhangi bir hatada boş harita — çağıran baş harfe düşer. */
export async function fetchTeamPhotos(): Promise<Map<string, string>> {
  try {
    const res = await fetch(SITE_JSON, { next: { revalidate: REVALIDATE_SN } });
    if (!res.ok) {
      console.error("fetchTeamPhotos: site.json alınamadı", res.status);
      return new Map();
    }
    return buildPhotoMap(await res.json());
  } catch (e) {
    console.error("fetchTeamPhotos:", e);
    return new Map();
  }
}

/** İstek başına tek fetch. */
export const getTeamPhotos = cache(fetchTeamPhotos);

/** Kısayol: bir üyenin fotoğrafı (yoksa null). */
export function photoFor(map: Map<string, string>, ad: string | null | undefined): string | null {
  if (!ad) return null;
  return map.get(normalizeName(ad)) ?? null;
}
