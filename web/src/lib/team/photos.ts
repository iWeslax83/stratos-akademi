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

function teamEntries(site: unknown): Named[] {
  const team = (site as { team?: { advisor?: unknown; members?: unknown } } | null)?.team;
  if (!team) return [];
  const entries: Named[] = [];
  if (team.advisor) entries.push(team.advisor as Named);
  if (Array.isArray(team.members)) entries.push(...(team.members as Named[]));
  return entries;
}

function add(map: Map<string, string>, entry: Named) {
  const { name, photo } = entry ?? {};
  if (typeof name !== "string" || typeof photo !== "string" || !photo) return;
  map.set(normalizeName(name), `${RAW}/public${photo.startsWith("/") ? photo : `/${photo}`}`);
}

/** site.json içeriğinden `normalize edilmiş isim → mutlak foto URL` haritası kurar. */
export function buildPhotoMap(site: unknown): Map<string, string> {
  const map = new Map<string, string>();
  teamEntries(site).forEach((e) => add(map, e));
  return map;
}

/** site.json içeriğindeki danışman+üyelerin ham (normalize edilmemiş) isimlerini sırayla döner. */
export function teamMemberNames(site: unknown): string[] {
  return teamEntries(site)
    .map((e) => e.name)
    .filter((n): n is string => typeof n === "string" && n.trim().length > 0);
}

async function fetchSiteJson(): Promise<unknown> {
  try {
    const res = await fetch(SITE_JSON, { next: { revalidate: REVALIDATE_SN } });
    if (!res.ok) {
      console.error("fetchSiteJson: site.json alınamadı", res.status);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error("fetchSiteJson:", e);
    return null;
  }
}

/** İstek başına tek fetch; getTeamPhotos ve getTeamNames aynı çağrıyı paylaşır. */
const getSiteJson = cache(fetchSiteJson);

/** Siteden haritayı çeker. Herhangi bir hatada boş harita — çağıran baş harfe düşer. */
export async function fetchTeamPhotos(): Promise<Map<string, string>> {
  return buildPhotoMap(await getSiteJson());
}

/** İstek başına tek fetch. */
export const getTeamPhotos = cache(fetchTeamPhotos);

/** Admin eşleştirme dropdown'u için: siteden ham isim listesi. */
export const getTeamNames = cache(async function fetchTeamNames(): Promise<string[]> {
  return teamMemberNames(await getSiteJson());
});

/**
 * Bir üyenin fotoğrafı (yoksa null). `stratosihaAd` (admin'in manuel eşleştirdiği isim)
 * doluysa ÖNCE onunla bakılır; boşsa `ad` ile otomatik eşleştirmeye düşülür
 * (geriye dönük davranış — bugün doğru eşleşen kimsenin fotoğrafı kaybolmaz).
 */
export function photoFor(
  map: Map<string, string>,
  ad: string | null | undefined,
  stratosihaAd?: string | null,
): string | null {
  if (stratosihaAd) {
    return map.get(normalizeName(stratosihaAd)) ?? null;
  }
  if (!ad) return null;
  return map.get(normalizeName(ad)) ?? null;
}
