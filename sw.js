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
  let notificationData = {
    title: 'Bildirim Sistemi',
    body: 'Yeni bildirim!',
    icon: '/FurkAI_Project/icon-192.png',
    badge: '/FurkAI_Project/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  // Eğer veri gönderilmişse kullan
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData.title = data.title || 'Bildirim Sistemi';
      notificationData.body = data.body || 'Yeni bildirim!';
      notificationData.data = { ...notificationData.data, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    ...notificationData,
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
    ],
    requireInteraction: true, // Bildirimi otomatik kapatma
    silent: false, // Ses çıkar
    tag: 'bildirim-sistemi' // Aynı tag'li bildirimleri değiştir
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
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
