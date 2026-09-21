import { clsx } from "clsx";

// Dal ikonları: tek çizgi-stili SVG. DB'deki `tracks.ikon` alanı ya bir anahtar
// (layers, chip, ...) ya da eski seed'den kalan emoji olabilir; ikisi de aynı ikona çözülür.
export type TrackIconKey = "layers" | "chip" | "code" | "cog" | "controller" | "megaphone" | "dot";

export const TRACK_IKONLAR: { key: Exclude<TrackIconKey, "dot">; label: string }[] = [
  { key: "layers", label: "Temel (katmanlar)" },
  { key: "chip", label: "Aviyonik (devre)" },
  { key: "code", label: "Yazılım (kod)" },
  { key: "cog", label: "Mekanik (dişli)" },
  { key: "controller", label: "Pilot (kumanda)" },
  { key: "megaphone", label: "Tanıtım (megafon)" },
];

const BY_SLUG: Record<string, TrackIconKey> = {
  "ortak-temel": "layers", ortak: "layers", temel: "layers",
  aviyonik: "chip", elektronik: "chip",
  yazilim: "code",
  mekanik: "cog", tasarim: "cog",
  pilot: "controller",
  "tanitim-sponsorluk": "megaphone",
};

const BY_EMOJI: Record<string, TrackIconKey> = {
  "🚀": "layers", "🛠️": "layers", "🛠": "layers",
  "⚡": "chip",
  "💻": "code",
  "🏗️": "cog", "🏗": "cog",
  "🎮": "controller",
  "📣": "megaphone",
};

const KEYS = new Set<string>(TRACK_IKONLAR.map((i) => i.key));

// Öncelik: ikon alanı bir anahtarsa o; sonra slug; sonra eski emoji; yoksa nokta.
export function resolveTrackIcon(slug: string | null | undefined, ikon: string | null | undefined): TrackIconKey {
  if (ikon && KEYS.has(ikon)) return ikon as TrackIconKey;
  if (slug && BY_SLUG[slug]) return BY_SLUG[slug];
  if (ikon && BY_EMOJI[ikon]) return BY_EMOJI[ikon];
  return "dot";
}

const PATHS: Record<TrackIconKey, React.ReactNode> = {
  layers: (<><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></>),
  chip: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
    </>
  ),
  code: (<><path d="m8 8-5 4 5 4" /><path d="m16 8 5 4-5 4" /><path d="m14 5-4 14" /></>),
  cog: (<><path d="M10.13 5.46 L10.24 2.97 L13.76 2.97 L13.87 5.46 L15.30 6.05 L17.14 4.37 L19.63 6.86 L17.95 8.70 L18.54 10.13 L21.03 10.24 L21.03 13.76 L18.54 13.87 L17.95 15.30 L19.63 17.14 L17.14 19.63 L15.30 17.95 L13.87 18.54 L13.76 21.03 L10.24 21.03 L10.13 18.54 L8.70 17.95 L6.86 19.63 L4.37 17.14 L6.05 15.30 L5.46 13.87 L2.97 13.76 L2.97 10.24 L5.46 10.13 L6.05 8.70 L4.37 6.86 L6.86 4.37 L8.70 6.05 Z" /><circle cx="12" cy="12" r="2.6" /></>),
  controller: (
    <>
      <rect x="3" y="8" width="18" height="9" rx="3" />
      <path d="M8 11v3M6.5 12.5h3" />
      <circle cx="16" cy="12.5" r="1" />
    </>
  ),
  megaphone: (<><path d="M3 11v3h3l7 4V7L6 11H3z" /><path d="M17 9a4 4 0 0 1 0 6" /></>),
  dot: <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />,
};

export function TrackIcon({
  slug, ikon, size = 20, className,
}: {
  slug?: string | null; ikon?: string | null; size?: number; className?: string;
}) {
  const key = resolveTrackIcon(slug, ikon);
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-icon={key}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx("shrink-0", className)}
    >
      {PATHS[key]}
    </svg>
  );
}
