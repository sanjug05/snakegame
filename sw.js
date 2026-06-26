// Snake: Retro Reimagined — service worker
//
// Strategy: cache-first for the app shell (offline-first), network-revalidate in background.
// On install we pre-cache everything so the app works offline from the very first load,
// even without a second reload. On any network fetch we also update the cache silently,
// so the next open gets fresh content without blocking the current one.

const CACHE = "snake-retro-v3";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "./apple-touch-icon.png"
];

// Pre-cache the entire app shell at install time so offline works immediately
// after the PWA is installed, without requiring a second online load first.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // clean up any caches from previous versions
      caches.keys().then((names) =>
        Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      )
    ])
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Only intercept requests for our own origin (don't break external requests)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(event.request).then((cached) => {
        // Fetch from network in the background to keep cache fresh for next time
        const networkFetch = fetch(event.request)
          .then((res) => {
            if (res && res.status === 200) cache.put(event.request, res.clone());
            return res;
          })
          .catch(() => null);

        // Return cached version immediately if we have it (fast, offline-capable),
        // otherwise wait for the network (first-ever load with no cache yet).
        return cached || networkFetch;
      })
    )
  );
});
