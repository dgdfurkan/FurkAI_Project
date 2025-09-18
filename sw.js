// Service Worker v2.0.0 - Canlı Bildirim Sistemi
const CACHE_NAME = 'bildirim-sistemi-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Service Worker kurulumu
self.addEventListener('install', function(event) {
  console.log('Service Worker v2.0.0 kuruluyor...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache açıldı');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker v2.0.0 kuruldu');
        return self.skipWaiting();
      })
  );
});

// Service Worker aktivasyonu
self.addEventListener('activate', function(event) {
  console.log('Service Worker v2.0.0 aktifleştiriliyor...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Eski cache siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker v2.0.0 aktif');
      return self.clients.claim();
    })
  );
});

// Fetch olayları - Offline destek
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

// Push bildirimleri - Canlı bildirimler
self.addEventListener('push', event => {
  console.log('Push event alındı:', event);
  
  let data = { 
    title: '🔔 Bildirim Sistemi v2.0.0', 
    body: 'Yeni bildirim!', 
    url: '/',
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  };
  
  if (event.data) {
    try { 
      data = { ...data, ...event.data.json() }; 
      console.log('Push data:', data);
    } catch (e) { 
      data.body = event.data.text(); 
      console.log('Push text data:', data.body);
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    silent: false,
    tag: data.tag || 'bildirim-sistemi-v2',
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      version: '2.0.0'
    },
    actions: [
      {
        action: 'view',
        title: 'Görüntüle',
        icon: '/icon-192.png'
      },
      {
        action: 'dismiss',
        title: 'Kapat',
        icon: '/icon-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => {
        console.log('✅ Bildirim gösterildi:', data.title);
      })
      .catch(error => {
        console.error('❌ Bildirim hatası:', error);
      })
  );
});

// Bildirim tıklama olayı
self.addEventListener('notificationclick', event => {
  console.log('Bildirim tıklandı:', event);
  
  event.notification.close();
  
  const action = event.action;
  const url = event.notification.data?.url || '/';
  
  if (action === 'dismiss') {
    console.log('Bildirim kapatıldı');
    return;
  }
  
  // Uygulamayı aç
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Eğer uygulama zaten açıksa, odaklan
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            console.log('Mevcut pencere odaklanıyor');
            return client.focus();
          }
        }
        
        // Yeni pencere aç
        if (clients.openWindow) {
          console.log('Yeni pencere açılıyor:', url);
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync (desteklenen tarayıcılarda)
self.addEventListener('sync', event => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Burada zamanlanmış bildirimleri kontrol edebilirsiniz
      console.log('Background sync çalışıyor')
    );
  }
});

// Message event (ana uygulamadan gelen mesajlar)
self.addEventListener('message', event => {
  console.log('Service Worker mesaj alındı:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker v2.0.0 yüklendi - Canlı bildirim sistemi hazır');