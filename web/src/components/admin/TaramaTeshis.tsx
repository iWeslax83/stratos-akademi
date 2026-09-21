import { Card } from "@/components/ui/Card";
import { huniMetni, neOldu } from "@/lib/videos/diag-text";
import type { ScanDiag } from "@/lib/videos/types";

export type ScanRun = {
  id: string;
  created_at: string;
  taranan: number;
  aday: number;
  eklenen: number;
  budanan: number;
  hata: string | null;
  diag: ScanDiag | null;
};

function tarih(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
}

export function TaramaTeshis({ runs }: { runs: ScanRun[] }) {
  if (runs.length === 0) {
    return (
      <Card>
        <p className="text-sm text-fg-soft">
          Henüz hiç tarama koşmadı. &quot;Şimdi Tara&quot; ile başlat. Koşunun her adımı buraya yazılır.
        </p>
      </Card>
    );
  }

  const son = runs[0];
  const sebep = son.diag ? neOldu(son.diag) : son.hata;

  return (
    <div className="flex flex-col gap-2">
      {son.eklenen === 0 && sebep && (
        <Card>
          <p className="text-sm font-semibold text-fg">
            Son tarama hiç öneri üretmedi
          </p>
          <p className="mt-1 text-sm text-fg-soft">{sebep}</p>
        </Card>
      )}

      {runs.map((r) => (
        <Card key={r.id}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-fg">{tarih(r.created_at)}</span>
            <span className="text-sm text-fg-soft">
              {r.taranan} tarandı · {r.aday} aday · <strong className="text-fg">{r.eklenen} yeni öneri</strong> · {r.budanan} budandı
            </span>
          </div>
          {r.diag && (
            <p className="mt-2 font-mono text-xs text-fg-soft">{huniMetni(r.diag)}</p>
          )}
          {r.hata && <p className="mt-2 text-xs text-danger-fg">{r.hata}</p>}
          {r.diag?.hatalar.map((h) => (
            <p key={h} className="mt-1 text-xs text-danger-fg">{h}</p>
          ))}
        </Card>
      ))}
    </div>
  );
}
