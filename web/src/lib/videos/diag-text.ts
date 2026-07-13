import type { ScanDiag, RedNedeni } from "@/lib/videos/types";

const NEDEN_ETIKET: Record<RedNedeni, string> = {
  zaten_var: "zaten var",
  canli_yayin: "canlı yayın",
  gomulemez: "gömülemez",
  tr_engelli: "TR'de engelli",
  az_izlenme: "az izlenme",
  kisa_sure: "kısa süre",
  eski: "eski",
  dil: "dil uymuyor",
};

// Elenme nedenlerini "10 az izlenme, 8 eski" gibi, çoktan aza sıralı yazar.
export function elemeMetni(eleme: ScanDiag["eleme"]): string {
  const parts = (Object.entries(eleme) as [RedNedeni, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${n} ${NEDEN_ETIKET[k]}`);
  return parts.join(", ");
}

// Taramanın hunisini tek satırda anlatır — "öneri neden gelmedi" sorusunun cevabı.
export function huniMetni(d: ScanDiag): string {
  const elenen = Object.values(d.eleme).reduce((a, b) => a + b, 0);
  const el = elemeMetni(d.eleme);
  return [
    `${d.sorgu_sayisi} sorgu → ${d.tekil_id} tekil video`,
    `${d.detay_cekilen} detay çekildi`,
    `${elenen} elendi${el ? ` (${el})` : ""}`,
    `${d.siniflandirilan} sınıflandırıldı`,
    `${d.gemini_uygun} uygun · ${d.gemini_uygunsuz} uygunsuz · ${d.gemini_hata} hata`,
  ].join(" · ");
}

// Öneri çıkmadıysa en olası tek sebebi söyler. Tahmin değil: huniye bakar.
export function neOldu(d: ScanDiag): string | null {
  if (d.hatalar.length > 0) return `API hatası: ${d.hatalar[0]}`;
  if (d.modul_sayisi === 0) return "Müfredatta hiç modül yok — arama sorgusu üretilemiyor.";
  if (d.sorgu_sayisi === 0) return "Hiç arama sorgusu üretilemedi (modüllerin track'i yok).";
  if (d.tekil_id === 0) return "YouTube araması hiç sonuç döndürmedi.";
  if (d.detay_cekilen === 0) return "Video detayları çekilemedi.";
  if (d.filtreden_gecen === 0) {
    return `Bulunan videoların tamamı mekanik filtrede elendi (${elemeMetni(d.eleme)}). Eşikleri gevşetmeyi dene.`;
  }
  if (d.gemini_uygun === 0 && d.gemini_hata > 0) return "Gemini sınıflandırması hata verdi.";
  if (d.gemini_uygun === 0) return "Gemini hiçbir videoyu modüllere uygun bulmadı.";
  return null;
}
