/**
 * sw.js — Service worker for the Chemical Engineering Reference.
 * Precaches the whole (tiny, self-contained) site so it installs as an offline
 * PWA. Cache-first with a network fallback; bump CACHE_VERSION on each release
 * to invalidate old caches. Only runs on the deployed https:// site — the
 * file:// path never registers it (guarded in script.js).
 */
const CACHE_VERSION = "cheref-v2";

const PRECACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/Img/fonts.css",
  "/Img/fonts/QGYvz_MVcBeNP4NJtEtq.woff2",
  "/Img/fonts/QGYvz_MVcBeNP4NJuktqQ4E.woff2",
  "/Img/fonts/J7aHnp1uDWRBEqV98dVQztYldFcLowEF.woff2",
  "/Img/Studying-Tips.png",
  "/Img/favicon/favicon-96x96.png",
  "/Img/favicon/favicon.ico",
  "/Img/favicon/apple-touch-icon.png",
  "/Img/favicon/site.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Cache same-origin successful responses for next time.
          if (res && res.ok && new URL(req.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // Offline & uncached: fall back to the app shell for navigations.
          if (req.mode === "navigate") return caches.match("/index.html");
          return new Response("", { status: 504, statusText: "Offline" });
        });
    })
  );
});
