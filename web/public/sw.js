// Stratos Akademi — service worker.
// Tutucu strateji: yalnız PUBLIC statik varlıkları önbelleğe alır, kimlik doğrulamalı
// HTML/veri ASLA önbelleğe alınmaz. Ağ yokken gezinmede çevrimdışı sayfası gösterilir.

const VERSION = "v1";
const STATIC_CACHE = `stratos-static-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// Yalnız aynı-köken + immutable statik varlıklar önbelleğe uygun.
function isCacheableStatic(url) {
  if (url.origin !== self.location.origin) return false;
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/apple-icon.png" ||
    url.pathname === "/icon.png"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Gezinme istekleri: önce ağ, başarısızsa çevrimdışı sayfası. (HTML önbelleğe ALINMAZ.)
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Statik varlıklar: stale-while-revalidate (önbellekten ver, arkada tazele).
  if (isCacheableStatic(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((res) => {
              if (res && res.ok) cache.put(request, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || network;
        }),
      ),
    );
    return;
  }

  // Diğer her şey (Supabase, RSC verisi vb.): doğrudan ağ — önbellek yok.
});
