// Snake: Retro Reimagined — service worker
//
// Network-first: every load tries the network first, so a fresh deploy reaches
// already-installed users the next time they open the app (while online).
// Only falls back to the cache when there's no network at all — that's what
// keeps the installed app usable offline, it just isn't the default path.

const CACHE = "snake-retro-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // drop any caches left over from a previous version of this service worker
      caches.keys().then((names) =>
        Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      )
    ])
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
