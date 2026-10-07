import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// /api/cron: oturum çerezi yoktur (GitHub Actions çağırır) ve kendi Bearer CRON_SECRET
// doğrulamasını yapar. Buraya alınmazsa proxy onu /login'e yönlendirir ve cron hiç koşmaz.
// /api/allowlist: Stratos sitesi çağırır, oturum çerezi yoktur ve kendi Bearer
// ALLOWLIST_SYNC_TOKEN doğrulamasını yapar (token yoksa 401). Aksi halde proxy POST'u
// /login'e 307 ile yönlendirir ve /login 405 verir.
const PUBLIC_PATHS = ["/login", "/auth", "/offline", "/api/cron", "/api/allowlist"];

export function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Kanonik Supabase kalıbı: önce request'e yaz, sonra response'u YENİDEN OLUŞTUR ki
          // yenilenen oturum çerezleri downstream (RSC + server action) isteğe iletilsin.
          // Aksi halde action eski refresh token'ı kullanır → "refresh token already used".
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // createServerClient ile getClaims arasına kod KOYMA (Supabase uyarısı).
  // getClaims imzayı asimetrik anahtarla yerel doğrular (ağ turu yok) ve süresi dolmuş
  // token'ı yeniler; getUser() ise her istekte Auth sunucusuna gidiyordu.
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims?.sub ? claimsData.claims : null;

  const path = request.nextUrl.pathname;

  if (!user && !isPublicPath(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  // Genel/statik dosyalar proxy dışı: oturum çerezi olmayan istemciler (tarayıcı manifest
  // isteği, PWA service worker, arama motoru robotu) /login'e yönlendirilmemeli.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|robots.txt|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
