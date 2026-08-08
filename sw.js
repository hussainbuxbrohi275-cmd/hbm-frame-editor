// Basic service worker — caches the app shell so PWABuilder / Chrome recognize this as an installable PWA.
const CACHE_NAME = 'hbm-frame-editor-v1';
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
  // Network-first for everything (this app relies on live Firebase/EmailJS calls),
  // falling back to cache only if the network request fails (e.g. offline).
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
