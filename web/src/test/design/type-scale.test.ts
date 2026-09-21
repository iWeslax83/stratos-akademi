import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import tailwindConfig from "../../../tailwind.config";

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? tsxFiles(p) : p.endsWith(".tsx") ? [p] : [];
  });
}

const SRC = join(__dirname, "../..");
const FILES = [...tsxFiles(join(SRC, "app")), ...tsxFiles(join(SRC, "components"))];

describe("tipografi ölçeği", () => {
  it("bileşenlerde keyfi piksel yazı boyutu (text-[13px] gibi) kalmaz", () => {
    const ihlal = FILES.flatMap((f) => {
      const m = readFileSync(f, "utf8").match(/text-\[\d+(?:\.\d+)?(?:px|rem)\]/g);
      return m ? [`${f.replace(SRC + "/", "")}: ${m.join(", ")}`] : [];
    });
    expect(ihlal).toEqual([]);
  });

  it("ölçekte 12px altı boyut yok, 2sm 13px olarak tanımlı", () => {
    const fs = (tailwindConfig.theme?.extend as { fontSize?: Record<string, [string, unknown]> }).fontSize ?? {};
    expect(fs["2sm"]?.[0]).toBe("0.8125rem");
    for (const [, v] of Object.entries(fs)) {
      expect(parseFloat(v[0]) * 16).toBeGreaterThanOrEqual(12);
    }
  });
});
