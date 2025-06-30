const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
  '/Gangsterz300/',
  '/Gangsterz300/index.html',
  '/Gangsterz300/script.js',
  '/Gangsterz300/manifest.json',
  '/Gangsterz300/icon-192.jpg',
  '/Gangsterz300/icon-512.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});