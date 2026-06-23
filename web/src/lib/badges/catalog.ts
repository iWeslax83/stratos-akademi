// Rozetler (achievements) — türetilmiş. Her rozet tek bir sayısal istatistiğe ve
// eşiğe bağlıdır: stat >= esik ise kazanılır. Depolama yok; mevcut verilerden hesaplanır.
// Spec: docs/superpowers/specs/2026-06-23-stratos-akademi-rozet-design.md

export type BadgeDep =
  | "lessons" // tamamlanan ders sayısı
  | "tasks" // onaylı pratik görev sayısı
  | "competencies" // tamamlanan dal (yetkinlik) sayısı
  | "points" // toplam puan
  | "streak" // günlük seri (yalnız kendi profilinde veri var → private)
  | "quizPerfect"; // tam puanlı quiz sayısı (private)

export type Badge = {
  id: string;
  ad: string;
  aciklama: string;
  ikon: string;
  dep: BadgeDep;
  esik: number;
  /** public = başka üyenin profilinde de hesaplanabilir (RPC verisi yeterli). */
  public: boolean;
};

export type BadgeStats = Record<BadgeDep, number>;

// public alanlar her yerde (member_profile RPC) hesaplanabilir; private yalnız kendi profilinde.
const PRIVATE_DEPS: ReadonlySet<BadgeDep> = new Set<BadgeDep>(["streak", "quizPerfect"]);

function badge(id: string, ad: string, aciklama: string, ikon: string, dep: BadgeDep, esik: number): Badge {
  return { id, ad, aciklama, ikon, dep, esik, public: !PRIVATE_DEPS.has(dep) };
}

export const BADGES: Badge[] = [
  // Ders
  badge("ilk-ders", "İlk Adım", "İlk dersini tamamladın", "🎯", "lessons", 1),
  badge("merakli", "Meraklı", "5 ders tamamladın", "📚", "lessons", 5),
  badge("azimli", "Azimli", "15 ders tamamladın", "🔭", "lessons", 15),
  badge("maraton", "Maratoncu", "30 ders tamamladın", "🏔️", "lessons", 30),
  // Görev
  badge("gorev-eri", "Görev Eri", "İlk pratik görevin onaylandı", "✅", "tasks", 1),
  badge("sahada", "Sahada", "5 pratik görevin onaylandı", "🛠️", "tasks", 5),
  // Yetkinlik
  badge("uzman", "Dal Uzmanı", "Bir dalı tamamen bitirdin", "🎖️", "competencies", 1),
  badge("cok-yonlu", "Çok Yönlü", "Üç dalda yetkinlik kazandın", "🏅", "competencies", 3),
  // Puan
  badge("puan-250", "Yükselişte", "250 puana ulaştın", "📈", "points", 250),
  badge("puan-750", "Veteran", "750 puana ulaştın", "🌟", "points", 750),
  // Seri (private)
  badge("seri-3", "Isınıyor", "3 günlük seri yakaladın", "🌤️", "streak", 3),
  badge("seri-7", "Alev Aldı", "7 günlük seri yakaladın", "🔥", "streak", 7),
  badge("seri-30", "Sönmeyen Ateş", "30 günlük seri yakaladın", "☄️", "streak", 30),
  // Quiz (private)
  badge("tam-isabet", "Tam İsabet", "Bir quizden tam puan aldın", "💯", "quizPerfect", 1),
  badge("nisanci", "Keskin Nişancı", "Üç quizden tam puan aldın", "🏹", "quizPerfect", 3),
];
