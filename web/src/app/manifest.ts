import type { MetadataRoute } from "next";

// PWA manifest — "ana ekrana ekle" + bağımsız (standalone) açılış.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stratos Akademi",
    short_name: "Stratos",
    description: "Stratos / TMT-İHA kulübü eğitim platformu",
    start_url: "/panom",
    scope: "/",
    display: "standalone",
    background_color: "#05080F",
    theme_color: "#05080F",
    lang: "tr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
