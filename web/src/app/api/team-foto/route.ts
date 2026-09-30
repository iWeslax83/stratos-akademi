import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const REPO = "iWeslax83/stratos-website";
const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Özel repodaki takım fotoğraflarını token ile çekip oturumlu üyelere servis eder.
// Oturum kontrolünü proxy.ts yapar (bu yol public listede değil).
export async function GET(request: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  const p = request.nextUrl.searchParams.get("p") ?? "";
  const ext = p.split(".").pop()?.toLowerCase() ?? "";

  // Yalnız images/ altındaki bilinen görsel türleri; yol atlatma (..) yok.
  if (!token || !/^images\/[\w\-./]+$/.test(p) || p.includes("..") || !TYPES[ext]) {
    return new NextResponse(null, { status: 404 });
  }

  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/public/${p}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw+json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok || !res.body) return new NextResponse(null, { status: 404 });

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": TYPES[ext],
      "Cache-Control": "private, max-age=3600",
    },
  });
}
