import type { MetadataRoute } from "next";

// Kulüp-içi, giriş-gerektiren bir araç: arama motorlarının indekslemesini istemiyoruz
// (login/uygulama sayfaları aramada çıkmasın).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
