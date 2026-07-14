import type { Metadata, Viewport } from "next";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "600", "700", "800"] });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["400", "500", "600", "700"] });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const baslik = "Stratos Akademi";
const aciklama = "Stratos / TMT-İHA kulübü eğitim platformu";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Sayfalar kendi başlığını verdiğinde "Müfredat · Stratos Akademi" olur.
  title: { default: baslik, template: `%s · ${baslik}` },
  description: aciklama,
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Stratos" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: baslik,
    title: baslik,
    description: aciklama,
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Stratos Akademi amblemi" }],
  },
  twitter: {
    card: "summary",
    title: baslik,
    description: aciklama,
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#05080F",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${sora.variable} ${jakarta.variable} font-sans`} suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
