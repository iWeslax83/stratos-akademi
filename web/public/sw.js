// Stratos Akademi — service worker.
// Tutucu strateji: yalnız PUBLIC statik varlıkları önbelleğe alır, kimlik doğrulamalı
// HTML/veri ASLA önbelleğe alınmaz. Ağ yokken gezinmede çevrimdışı sayfası gösterilir.

const VERSION = "v2";
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

// Gezinme: önce ağ. Çevrimdışı sayfası YALNIZ tarayıcı gerçekten offline dediğinde
// gösterilir; online'ken tek seferlik ağ hatası/iptal için bir kez yeniden denenir.
// (Eski davranış her fetch reddinde offline'a düşüyordu → online kullanıcılar da
//  yanlışlıkla çevrimdışı sayfasını görüyordu.)
async function handleNavigate(request) {
  try {
    return await fetch(request);
  } catch (err) {
    // Tarayıcı kesin offline diyorsa doğrudan çevrimdışı sayfası.
    if (self.navigator && self.navigator.onLine === false) {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
      throw err;
    }
    // Online'ken tek seferlik hata (edge soğuk başlaması, iptal, sinyal dalgası):
    // bir kez daha dene; yine olmazsa son çare olarak çevrimdışı sayfası.
    try {
      return await fetch(request);
    } catch {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
      throw err;
    }
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Gezinme istekleri: önce ağ, gerçekten offline'ken çevrimdışı sayfası. (HTML önbelleğe ALINMAZ.)
  if (request.mode === "navigate") {
    event.respondWith(handleNavigate(request));
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
