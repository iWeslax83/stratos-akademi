import { cache } from "react";

// Fotoğraflar stratosiha.com'un içerik reposundan gelir: site admin panelinden
// (/admin/takim) yüklenen foto site.json'a yazılıp repoya commit edilir.
// JSON ve görseli aynı commit'ten okuyoruz, sitenin yeniden deploy olmasını
// beklemeden tutarlı kalsın diye.
const REPO = "iWeslax83/stratos-website";
const RAW = `https://raw.githubusercontent.com/${REPO}/main`;
const SITE_JSON = `${RAW}/src/content/site.json`;
const API_SITE_JSON = `https://api.github.com/repos/${REPO}/contents/src/content/site.json`;
const REVALIDATE_SN = 3600;
// Hata sonrası bu süre boyunca GitHub'a tekrar gidilmez: Next başarısız fetch'i cache'lemez,
// aksi halde her sayfa yüklemesi (Nav) yanıt beklemeden önce kırık bir isteğe takılır.
const BACKOFF_MS = 60_000;

let failedUntil = 0;

/** Testler için: hata beklemesini sıfırlar. */
export function resetSiteJsonBackoff() {
  failedUntil = 0;
}

/** Repo özelse okuma yetkili token gerekir; yoksa eski (public raw) davranış. */
function githubToken(): string | undefined {
  return process.env.GITHUB_TOKEN || undefined;
}

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
  const path = photo.startsWith("/") ? photo.slice(1) : photo;
  // Özel repoda raw URL tarayıcıdan 404 verir: oturumlu proxy (/api/team-foto) üzerinden servis et.
  const url = githubToken()
    ? `/api/team-foto?p=${encodeURIComponent(path)}`
    : `${RAW}/public/${path}`;
  map.set(normalizeName(name), url);
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
  if (Date.now() < failedUntil) return null;
  try {
    const token = githubToken();
    const res = await fetch(token ? API_SITE_JSON : SITE_JSON, {
      next: { revalidate: REVALIDATE_SN },
      ...(token && {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw+json" },
      }),
    });
    if (!res.ok) {
      console.error("fetchSiteJson: site.json alınamadı", res.status);
      failedUntil = Date.now() + BACKOFF_MS;
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error("fetchSiteJson:", e);
    failedUntil = Date.now() + BACKOFF_MS;
    return null;
  }
}

/** İstek başına tek fetch; getTeamPhotos ve getTeamNames aynı çağrıyı paylaşır. */
const getSiteJson = cache(fetchSiteJson);

/** Siteden haritayı çeker. Herhangi bir hatada boş harita, çağıran baş harfe düşer. */
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
 * doluysa ÖNCE onunla bakılır; bulunamazsa ya da boşsa `ad` ile otomatik eşleştirmeye
 * düşülür (geriye dönük davranış, bugün doğru eşleşen kimsenin fotoğrafı kaybolmaz).
 */
export function photoFor(
  map: Map<string, string>,
  ad: string | null | undefined,
  stratosihaAd?: string | null,
): string | null {
  if (stratosihaAd) {
    const hit = map.get(normalizeName(stratosihaAd));
    if (hit) return hit;
  }
  if (!ad) return null;
  return map.get(normalizeName(ad)) ?? null;
}
