# Stratos Akademi — Rozetler (Achievements) Tasarımı

**Tarih:** 2026-06-23
**Durum:** Onaylı (kilitli karar: "rozet + liderlik tablosu"; liderlik tamamdı, rozet eksikti)

## Amaç

Üyeleri ilerlemeye teşvik etmek için **kazanılan rozetler** (achievements). Liderlik
tablosu rekabeti; rozetler kişisel kilometre taşlarını gösterir. w3schools/oyunlaştırma
ruhu: "şunu yaptın → rozet kazandın."

## Karar: türetilmiş (derived-on-read), depolama yok (v1)

Rozetler **mevcut verilerden anlık hesaplanır** — ayrı tablo, migration veya yazma
yolu yok. Üyenin tamamladığı ders sayısı, onaylı görev sayısı, yetkinlikleri, puanı,
günlük serisi ve tam puanlı quiz sayısı zaten dashboard/profil için yükleniyor;
rozetler bu sayılardan eşik karşılaştırmasıyla çıkar.

Gerekçe: sıfır migration (insan kapısı yok), saf fonksiyon → kolay test, anında doğru
(geçmişe dönük rozetler otomatik). v2'de "kazanıldığında bildirim + kazanma tarihi"
için depolama eklenebilir (aşağıda).

## Veri bağımlılıkları

Her rozet tek bir sayısal istatistiğe ve eşiğe bağlıdır (`stat >= esik`):

| dep | Kaynak (kendi profili) | Kaynak (başka üye `/uye/[id]`) |
|---|---|---|
| `lessons` | `stats.completedCount` | `member.tamamlananDers` |
| `tasks` | onaylı görev sayısı | `member.onayliGorev` |
| `competencies` | `stats.earnedCompetencies.length` | `member.yetkinlikler.length` |
| `points` | `stats.points` | `member.puan` |
| `streak` | `stats.streak` | — (RPC vermiyor) |
| `quizPerfect` | `stats.bestQuizScores` içinde %100 sayısı | — (RPC vermiyor) |

**Görünürlük (scope):** `lessons/tasks/competencies/points` = **public** (her yerde
hesaplanabilir). `streak/quizPerfect` = **private** (yalnız kendi profilinde veri var).
Başka üyenin profilinde private rozetler **hiç gösterilmez** (kilitli/yanlış-negatif
göstermemek için), yalnız public alt küme grayscale ile gösterilir.

## Rozet kataloğu (15)

**Ders (`lessons`):** İlk Adım (1) · Meraklı (5) · Azimli (15) · Maratoncu (30)
**Görev (`tasks`):** Görev Eri (1) · Sahada (5)
**Yetkinlik (`competencies`):** Dal Uzmanı (1) · Çok Yönlü (3)
**Puan (`points`):** Yükselişte (250) · Veteran (750)
**Seri (`streak`, private):** Isınıyor (3) · Alev Aldı (7) · Sönmeyen Ateş (30)
**Quiz (`quizPerfect`, private):** Tam İsabet (1) · Keskin Nişancı (3)

Her rozet: `id`, `ad`, `aciklama`, `ikon` (emoji — CompetencyShelf'teki dal ikonlarıyla
tutarlı, işlevsel kimlik), `dep`, `esik`, `public: boolean`.

## Görünür yerler

- **`/profil`** (kendi): tam katalog (15) — kazanılan altın dolgulu, kilitli grayscale,
  `aciklama` tooltip. "Rozetler · X / 15" başlığı. Bir sonraki rozete ipucu (en yakın
  kilitli rozet + kalan miktar).
- **`/panom`** (dashboard): kazanılan rozetlerin kompakt şeridi (yalnız kazanılanlar,
  yoksa gösterme) — yetkinlik şeridinin yanında/altında.
- **`/uye/[id]`** (başka üye): yalnız public rozetler (10), kazanılan/kilitli.

## Tasarım dili (flat kurallarına uygun)

- Tek aksan = altın. Kazanılan rozet: altın yumuşak dolgu + altın kenar (CompetencyShelf
  earned stiliyle birebir). Kilitli: nötr dolgu + grayscale + opacity-50. Gradyan/glow yok.
- İkon kutusu `rounded-xl`, etiket altında küçük puntoyla. Tutarlı dikey ritim.
- Emoji yalnız rozet **kimliği** olarak (dekoratif değil) — mevcut dal ikonu kalıbı.

## Saf fonksiyon sözleşmesi

```ts
type BadgeDep = "lessons" | "tasks" | "competencies" | "points" | "streak" | "quizPerfect";
type Badge = { id: string; ad: string; aciklama: string; ikon: string; dep: BadgeDep; esik: number; public: boolean };
type BadgeStats = Record<BadgeDep, number>;

computeBadges(stats: BadgeStats): Set<string>      // esik karşılanan rozet id'leri
badgeProgress(stats, scope): { badge: Badge; earned: boolean; current: number }[]  // scope ile public süzme
nextBadge(stats, scope): { badge: Badge; current: number; kalan: number } | null   // en yakın kilitli
```

`quizPerfect` sayımı: `bestQuizScores.filter(s => s >= 100).length` (çağıran tarafta hesaplanır).

## v2 (kapsam dışı, not)

- Kazanma anında **in-app bildirim** ("Yeni rozet: Alev Aldı") — `notifications` tablosu
  + kazanılan rozetleri depolama (dedup için `user_badges`).
- Kazanma tarihi rozet üstünde.
- Admin tanımlı özel rozetler.

Bunlar migration gerektirir; v1 türetilmiş kalır.
