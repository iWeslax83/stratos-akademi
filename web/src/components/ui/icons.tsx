import { clsx } from "clsx";

// Tek çizgi-stili SVG ikon seti (Unicode glyph "→ ≡ ✓ ✗ ●" yerine, font bağımsız,
// tema/renk currentColor ile). Hepsi aria-hidden; anlam komşu metinde ya da sr-only'de.
type IconProps = { className?: string; size?: number };

function svg(path: React.ReactNode, { className, size = 16 }: IconProps, viewBox = "0 0 24 24") {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx("shrink-0", className)}
    >
      {path}
    </svg>
  );
}

export function ArrowRightIcon(p: IconProps) {
  return svg(<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>, p);
}

export function MenuIcon(p: IconProps) {
  return svg(<><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>, p);
}

export function CheckIcon(p: IconProps) {
  return svg(<path d="M20 6 9 17l-5-5" />, p);
}

export function XIcon(p: IconProps) {
  return svg(<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>, p);
}

export function PlayIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={clsx("shrink-0", className)}
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

// Dolu nokta, "devam ediyor" durumu için.
export function DotIcon({ className, size = 10 }: IconProps) {
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 10 10" className={clsx("shrink-0", className)}>
      <circle cx="5" cy="5" r="4" fill="currentColor" />
    </svg>
  );
}

// Boş halka, "yapılacak" durumu için.
export function RingIcon({ className, size = 10 }: IconProps) {
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 10 10" fill="none" className={clsx("shrink-0", className)}>
      <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ChevronUpIcon(p: IconProps) {
  return svg(<path d="m6 15 6-6 6 6" />, p);
}
export function ChevronDownIcon(p: IconProps) {
  return svg(<path d="m6 9 6 6 6-6" />, p);
}
