const CACHE_NAME = 'atmos-pwa-v1.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/dashboard.css',
  './css/components.css',
  './css/responsive.css',
  './css/animations.css',
  './js/storage.js',
  './js/api.js',
  './js/geocoding.js',
  './js/location.js',
  './js/forecast.js',
  './js/weather-map.js',
  './js/air-quality.js',
  './js/charts.js',
  './js/favorites.js',
  './js/settings.js',
  './js/alerts.js',
  './js/export.js',
  './js/app.js',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
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

// Network-first for Open-Meteo API calls, Cache-first for static shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.hostname.includes('open-meteo.com')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ offline: true, error: 'Network unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
