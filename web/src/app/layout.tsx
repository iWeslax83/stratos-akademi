import type { Metadata, Viewport } from "next";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "600", "700", "800"] });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Stratos Akademi",
  description: "Stratos / TMT-İHA kulübü eğitim platformu",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Stratos" },
};

export const viewport: Viewport = {
  themeColor: "#16243F",
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
