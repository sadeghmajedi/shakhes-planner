const CACHE = 'shakhes-planner-v2';
const FILES = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first for navigation/HTML requests so updates are picked up immediately.
  // Falls back to cache only if the network is unavailable (offline support preserved).
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then(networkResponse => {
          const copy = networkResponse.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copy));
          return networkResponse;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first for everything else (icons, manifest, fonts, etc.)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
