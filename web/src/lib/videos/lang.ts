import type { Lang } from "@/lib/videos/types";

const NON_LATIN = /[぀-ヿ一-鿿؀-ۿЀ-ӿऀ-ॿ가-힯]/;
const TR_CHARS = /[ğışĞİŞçÇöÖüÜ]/;
const TR_WORDS = /\b(ve|bir|için|nasıl|ile|bu|çok|yapımı|dersi|anlatım|kurulum)\b/i;
const EN_WORDS = /\b(the|and|how|to|with|for|build|tutorial|guide|setup)\b/i;

// Başlık/açıklamadan kaba dil sezme. TR/EN dışını "other" işaretler (filtre bunları eler).
export function detectLang(text: string): Lang {
  const s = (text ?? "").trim();
  if (!s) return "other";
  // Latin dışı yazım baskınsa other.
  const nonLatinHits = (s.match(new RegExp(NON_LATIN, "g")) ?? []).length;
  if (nonLatinHits >= 3) return "other";
  if (TR_CHARS.test(s) || TR_WORDS.test(s)) return "tr";
  if (EN_WORDS.test(s)) return "en";
  // Belirgin işaret yok ama Latin yazım → en varsay (çöp değil, admin süzer).
  if (/[a-zA-Z]/.test(s)) return "en";
  return "other";
}
