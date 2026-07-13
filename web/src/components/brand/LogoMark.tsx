// Stratos amblemi — yükselen delta gövde, her kanatta üç bıçak.
// Inline SVG: her boyutta net kalır. Kanatlar currentColor, delta akademi
// vurgu rengi (amblemin turkuazı). Statik kopya: /brand/logo.svg

const VIEW = { x: 32, y: 94, w: 448, h: 294 };

export function LogoMark({
  size = 28,
  className = "",
  deltaClassName = "fill-accent-ink dark:fill-accent",
}: {
  /** px cinsinden yükseklik; genişlik en-boy oranına göre ölçeklenir. */
  size?: number;
  className?: string;
  /** Koyu zemine oturan amblemlerde delta'yı hep parlak turkuaza çekmek için. */
  deltaClassName?: string;
}) {
  const width = Math.round((size * VIEW.w) / VIEW.h);
  return (
    <svg
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      width={width}
      height={size}
      role="img"
      aria-label="Stratos amblemi"
      className={`shrink-0 ${className}`}
    >
      <g fill="currentColor">
        <polygon points="296,236 470,158 470,188 296,266" />
        <polygon points="308,292 439,233 439,263 308,322" />
        <polygon points="318,348 408,307 408,337 318,378" />
        <polygon points="216,236 42,158 42,188 216,266" />
        <polygon points="204,292 73,233 73,263 204,322" />
        <polygon points="194,348 104,307 104,337 194,378" />
      </g>
      <polygon className={deltaClassName} points="256,104 310,352 256,300 202,352" />
    </svg>
  );
}
