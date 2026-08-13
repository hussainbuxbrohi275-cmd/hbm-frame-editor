// Service worker — makes the core editor (photos/videos/filters/etc.) work fully offline.
// Pro/payment features (Firebase, JazzCash flow, EmailJS) still need internet — this
// worker deliberately leaves those cross-origin requests untouched.
const CACHE_NAME = 'hbm-frame-editor-v2';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle our own GET requests — never intercept Firebase/EmailJS/etc. calls,
  // and never touch non-GET requests (payment submissions, Firestore writes).
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Cache-first: the editor loads instantly and works offline; we refresh the
  // cache in the background whenever a newer version is reachable online.
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
