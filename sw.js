const CACHE = 'shakhes-planner-v1.11.1';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    // Individual puts so one missing asset can't fail the whole install.
    caches.open(CACHE).then(cache =>
      Promise.all(FILES.map(f => cache.add(f).catch(() => null)))
    )
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
  if (e.request.method !== 'GET') return;

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

  // Cache-first for everything else (icons, manifest, fonts, etc.),
  // storing successful responses so they are actually available offline.
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.ok && networkResponse.type !== 'opaque') {
          const copy = networkResponse.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copy));
        }
        return networkResponse;
      });
    })
  );
});
