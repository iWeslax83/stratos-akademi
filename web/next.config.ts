import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Çoklu lockfile uyarısını gider: bu klasörü (web/) Turbopack kökü yap.
  turbopack: {
    root: projectRoot,
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
