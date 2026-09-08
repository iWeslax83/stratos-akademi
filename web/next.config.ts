import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

// Supabase kaynağı (REST + Realtime + Storage). Build'de tanımlı; yoksa CSP connect-src'i
// yalnız 'self' kalır ve prod'da istek düşer — .env eksikse zaten uygulama çalışmaz.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).origin : "";
const supabaseWs = supabaseHost ? supabaseHost.replace(/^http/, "ws") : "";

// Not: script/style'da 'unsafe-inline' var — Next runtime + styled-jsx bunu ister.
// Uygulamada dangerouslySetInnerHTML yok, React kaçışı açık; nonce tabanlı sıkılaştırma
// ileride proxy.ts üzerinden yapılabilir. Diğer yönergeler (frame-ancestors, object-src,
// base-uri, form-action) şimdiden clickjacking / veri sızdırma yollarını kapatır.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  `img-src 'self' data: blob: https://raw.githubusercontent.com https://i.ytimg.com${supabaseHost ? " " + supabaseHost : ""}`,
  "media-src 'self' blob:",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
  `connect-src 'self'${supabaseHost ? ` ${supabaseHost} ${supabaseWs}` : ""}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

// CSP yalnız prod'da: next dev'in HMR websocket'i + eval'i geliştirmede CSP'ye takılır.
const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Çoklu lockfile uyarısını gider: bu klasörü (web/) Turbopack kökü yap.
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    // Üye profil fotoğrafları stratosiha.com'un içerik reposundan gelir.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/iWeslax83/stratos-website/**",
      },
    ],
  },
};

export default nextConfig;
