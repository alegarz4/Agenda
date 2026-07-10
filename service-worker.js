/* Service Worker de Lumen Planner v2.
   Mantiene la agenda disponible offline en GitHub Pages. */

const CACHE_NAME = 'lumen-planner-v2-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './src/css/theme.css',
  './src/css/base.css',
  './src/css/layout.css',
  './src/css/components.css',
  './src/css/responsive.css',
  './src/js/app.js',
  './src/js/core/pwa.js',
  './src/js/core/storage.js',
  './src/js/utils/date.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => cachedResponse || fetch(event.request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });

          return networkResponse;
        })
        .catch(() => caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      includeUncontrolled: true,
      type: 'window'
    }).then((clientList) => {
      const currentClient = clientList.find((client) => client.url.includes('/Agenda/'));

      if (currentClient) {
        return currentClient.focus();
      }

      return clients.openWindow('./index.html#alertas');
    })
  );
});
