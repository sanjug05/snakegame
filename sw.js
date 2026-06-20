// Snake: Retro Reimagined — service worker
// Caches the app shell so it can reopen (and the installed app can relaunch)
// even without a network connection. Intentionally simple: cache-first with a
// network refresh, falling back to whatever's cached if the network fails.

const CACHE = "snake-retro-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((res) => {
            cache.put(event.request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
