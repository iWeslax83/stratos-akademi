import { createServiceClient } from "@/lib/supabase/service";
import { createProductionPorts } from "@/lib/videos/ports";
import { runVideoScan } from "@/lib/videos/scan";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export function authorize(request: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request): Promise<Response> {
  if (!authorize(request, process.env.CRON_SECRET)) {
    return Response.json({ error: "yetkisiz" }, { status: 401 });
  }
  const youtubeKey = process.env.YOUTUBE_API_KEY;
  const geminiKey = process.env.GOOGLE_API_KEY;
  if (!youtubeKey || !geminiKey) {
    return Response.json({ error: "YOUTUBE_API_KEY/GOOGLE_API_KEY eksik" }, { status: 500 });
  }
  try {
    const svc = createServiceClient();
    const ports = createProductionPorts(svc, { youtubeKey, geminiKey });
    const summary = await runVideoScan(ports);
    return Response.json({ ok: true, ...summary });
  } catch (e) {
    console.error("video-tara cron:", e);
    return Response.json({ error: "tarama başarısız" }, { status: 500 });
  }
}
