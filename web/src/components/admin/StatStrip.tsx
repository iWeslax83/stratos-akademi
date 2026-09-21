import { Card } from "@/components/ui/Card";

// Birbiriyle karşılaştırılan birkaç sayı: her biri ayrı kart yerine tek kartta,
// ince ayraçlarla. Anlamsal olarak tanım listesi (etiket, değer).
export function StatStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <Card>
      <dl className="grid grid-cols-2 sm:grid-flow-col sm:auto-cols-fr">
        {items.map((k) => (
          <div
            key={k.label}
            className="flex flex-col-reverse items-center justify-center gap-0.5 border-[var(--line)] p-4 text-center sm:border-l sm:first:border-l-0"
          >
            <dt className="text-xs font-semibold text-muted">{k.label}</dt>
            <dd className="font-display text-2xl font-extrabold tabular-nums text-fg">{k.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
