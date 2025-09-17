const CACHE_NAME = 'bildirim-sistemi-v1';
const urlsToCache = [
  '/FurkAI_Project/',
  '/FurkAI_Project/index.html',
  '/FurkAI_Project/style.css',
  '/FurkAI_Project/script.js',
  '/FurkAI_Project/manifest.json'
];

// Service Worker kurulumu
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

// Service Worker aktivasyonu
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch olayları
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Push bildirimleri
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'Yeni bildirim!',
    icon: '/FurkAI_Project/icon-192.png',
    badge: '/FurkAI_Project/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Görüntüle',
        icon: '/FurkAI_Project/icon-192.png'
      },
      {
        action: 'close',
        title: 'Kapat',
        icon: '/FurkAI_Project/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Bildirim Sistemi', options)
  );
});

// Bildirim tıklama olayları
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/FurkAI_Project/')
    );
  }
});
