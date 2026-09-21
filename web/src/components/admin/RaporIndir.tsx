import { smallButtonClasses } from "@/components/ui/Button";
const RAPORLAR = [
  { tip: "uyeler", etiket: "Üyeler" },
  { tip: "dersler", etiket: "Dersler" },
  { tip: "quizler", etiket: "Quizler" },
];

// CSV indirme. Sunucu Content-Disposition ile dosya döner; sade <a> yeter, JS gerekmez.
export function RaporIndir() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-muted">CSV indir:</span>
      {RAPORLAR.map((r) => (
        <a
          key={r.tip}
          href={`/api/admin/rapor?tip=${r.tip}`}
          download
          className={smallButtonClasses("ghost")}
        >
          {r.etiket}
        </a>
      ))}
    </div>
  );
}
