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
          className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          {r.etiket}
        </a>
      ))}
    </div>
  );
}
