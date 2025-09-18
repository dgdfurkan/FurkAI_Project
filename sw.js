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

// iOS uyumlu push bildirimleri
self.addEventListener('push', event => {
  let data = { 
    title: 'Bildirim Sistemi', 
    body: 'Yeni bildirim!', 
    url: '/FurkAI_Project/' 
  };
  
  if (event.data) {
    try { 
      data = { ...data, ...event.data.json() }; 
    } catch { 
      data.body = event.data.text(); 
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/FurkAI_Project/icon-192.png',
      badge: '/FurkAI_Project/icon-192.png',
      tag: 'bildirim-sistemi',
      data
    })
  );
});

// iOS uyumlu bildirim tıklama
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/FurkAI_Project/';
  event.waitUntil(clients.openWindow(url));
});

// iOS Safari'de timer'lar ve background sync desteklenmiyor
// Sadece push event'leri ile çalışıyoruz
