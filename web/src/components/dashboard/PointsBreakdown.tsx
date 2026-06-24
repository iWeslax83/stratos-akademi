import type { PointsBreakdown as Breakdown } from "@/lib/dashboard/points";

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold text-navy dark:text-white">{value}</span>
    </div>
  );
}

export function PointsBreakdown({ data }: { data: Breakdown }) {
  return (
    <div className="p-5">
      <div className="text-xs font-semibold text-muted">Puan dağılımı</div>
      <div className="mt-2 divide-y divide-[var(--line)]">
        <Row label="Dersler" value={data.ders} />
        <Row label="Quizler" value={data.quiz} />
        <Row label="Onaylı görevler" value={data.gorev} />
      </div>
      <div className="mt-2 flex items-center justify-between border-t-2 border-[var(--line)] pt-2.5">
        <span className="font-display text-sm font-bold text-navy dark:text-white">Toplam</span>
        <span className="font-display text-base font-extrabold text-gold">{data.toplam}</span>
      </div>
    </div>
  );
}
