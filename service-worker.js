/* Service Worker de Lumen Planner.
   Mantiene la app disponible offline en GitHub Pages y actualiza cache por version. */

const CACHE_NAME = 'lumen-planner-shell-v8';
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
  './src/js/app-local-fallback.js',
  './src/js/planner-tabs.js',
  './src/js/config/app-config.js',
  './src/js/core/pwa.js',
  './src/js/core/router.js',
  './src/js/core/storage.js',
  './src/js/modules/agenda/index.js',
  './src/js/modules/alerts/index.js',
  './src/js/modules/dashboard/index.js',
  './src/js/modules/planner/index.js',
  './src/js/modules/settings/index.js'
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
          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => caches.match('./index.html')))
  );
});

self.addEventListener('message', (event) => {
  const message = event.data || {};

  if (message.type !== 'LUMEN_SHOW_NOTIFICATION') {
    return;
  }

  const title = message.title || 'Lumen Planner';
  const options = {
    body: message.body || '',
    icon: './assets/icons/icon-192.png',
    badge: './assets/icons/icon-192.png',
    tag: message.tag || `lumen-${Date.now()}`,
    renotify: true,
    data: {
      url: './index.html'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      includeUncontrolled: true,
      type: 'window'
    }).then((clientList) => {
      const existingClient = clientList.find((client) => client.url.includes('/Agenda/'));

      if (existingClient) {
        return existingClient.focus();
      }

      return clients.openWindow('./index.html');
    })
  );
});
