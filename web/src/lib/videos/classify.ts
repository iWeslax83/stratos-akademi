import type { VideoDetail, ModuleRow, Classification } from "@/lib/videos/types";
import { hataOzeti } from "@/lib/videos/google-error";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

export function parseClassification(raw: string, validModuleIds: Set<string>): Classification | null {
  const cleaned = (raw ?? "").replace(/```json\s*|\s*```/g, "").trim();
  let obj: unknown;
  try {
    obj = JSON.parse(cleaned);
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;
  const o = obj as Record<string, unknown>;
  const module_id = typeof o.module_id === "string" ? o.module_id : null;
  const uygun = o.uygun === true && !!module_id && validModuleIds.has(module_id);
  const skorRaw = typeof o.skor === "number" ? o.skor : 0;
  const skor = Math.max(0, Math.min(100, Math.round(skorRaw)));
  const gerekce = typeof o.gerekce === "string" ? o.gerekce : "";
  return { uygun, module_id: uygun ? module_id : null, skor, gerekce };
}

function buildPrompt(v: VideoDetail, modules: ModuleRow[]): string {
  const list = modules.map((m) => `- ${m.id}: ${m.ad}`).join("\n");
  return [
    "Bir eğitim platformunun müfredatına video öneriyorsun. Aşağıdaki YouTube videosunun",
    "bu modüllerden BİRİNE uygun bir ders olup olmadığına karar ver.",
    "",
    "Modüller (id: ad):",
    list,
    "",
    `Video başlığı: ${v.baslik}`,
    `Video açıklaması: ${v.aciklama?.slice(0, 800) ?? ""}`,
    "",
    "Yalnızca şu JSON'u döndür (başka metin yok):",
    '{"uygun": boolean, "module_id": string|null, "skor": 0-100, "gerekce": "tek cümle Türkçe"}',
    "Uygun değilse uygun=false, module_id=null. skor = modüle uygunluk güveni.",
  ].join("\n");
}

export async function geminiClassify(
  v: VideoDetail,
  modules: ModuleRow[],
  deps: { apiKey: string; fetchImpl?: typeof fetch; onError?: (m: string) => void },
): Promise<Classification | null> {
  const f = deps.fetchImpl ?? fetch;
  try {
    const res = await f(`${GEMINI_URL}?key=${deps.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(v, modules) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    });
    if (!res.ok) {
      console.error("geminiClassify HTTP", res.status);
      deps.onError?.(`Gemini HTTP ${res.status}: ${await hataOzeti(res)}`);
      return null;
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const c = parseClassification(text, new Set(modules.map((m) => m.id)));
    if (!c) deps.onError?.(`Gemini yanıtı ayrıştırılamadı: ${text.slice(0, 120)}`);
    return c;
  } catch (e) {
    console.error("geminiClassify:", e);
    deps.onError?.(`Gemini ağ hatası: ${String(e)}`);
    return null;
  }
}
