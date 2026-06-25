// Sertifika uygunluğu — saf. Sertifika tamamen türetilmiş (DB yok): üye bir dalı
// (yetkinlik) bitirdiyse o dal için belge verilir.

export type CertTrack = { slug: string; ad: string; ikon: string | null };

// Verilen slug için belge hak edildiyse dal bilgisini, değilse null döner.
export function certificateFor(
  tracks: CertTrack[],
  earned: string[],
  slug: string,
): CertTrack | null {
  if (!earned.includes(slug)) return null;
  return tracks.find((t) => t.slug === slug) ?? null;
}

// Hak edilen tüm belgeler (dal sırası korunur).
export function earnedCertificates(tracks: CertTrack[], earned: string[]): CertTrack[] {
  const set = new Set(earned);
  return tracks.filter((t) => set.has(t.slug));
}
