// Service Worker v2.1.0 - Uygulama Kapalıyken Bildirim Sistemi
const CACHE_NAME = 'bildirim-sistemi-v2.1.0';
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
  console.log('Service Worker v2.1.0 kuruluyor...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache açıldı');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker v2.1.0 kuruldu');
        return self.skipWaiting();
      })
  );
});

// Service Worker aktivasyonu
self.addEventListener('activate', function(event) {
  console.log('Service Worker v2.1.0 aktifleştiriliyor...');
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
      console.log('✅ Service Worker v2.1.0 aktif');
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
    title: '🔔 Bildirim Sistemi v2.1.0', 
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
      version: '2.1.0'
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

// Background sync - Uygulama kapalıyken çalışır
self.addEventListener('sync', event => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      checkScheduledNotificationsInSW()
    );
  }
});

// Service Worker'da zamanlanmış bildirimleri kontrol et
async function checkScheduledNotificationsInSW() {
  console.log('Service Worker: Zamanlanmış bildirimler kontrol ediliyor...');
  
  try {
    // IndexedDB'den bildirimleri al
    const notifications = await getNotificationsFromIndexedDB();
    
    const now = new Date();
    const turkeyTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
    const currentTime = turkeyTime.getHours().toString().padStart(2, '0') + ':' + turkeyTime.getMinutes().toString().padStart(2, '0');
    const currentDate = turkeyTime.toISOString().split('T')[0];
    const currentDay = turkeyTime.getDay();
    
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    console.log('Service Worker: Bugün', dayNames[currentDay], currentDate, currentTime);
    
    console.log('Service Worker: Bildirim kontrolü:', {
      currentTime: currentTime,
      currentDate: currentDate,
      currentDay: currentDay,
      notifications: notifications.length
    });
    
    for (const notification of notifications) {
      if (notification.sent) continue;
      
      const timeMatch = notification.time === currentTime;
      const dayMatch = notification.days.includes(currentDay);
      const dateMatch = !notification.date || notification.date === currentDate;
      
      if (timeMatch && dayMatch && dateMatch) {
        console.log('Service Worker: Bildirim gönderiliyor:', notification.text);
        
        const options = {
          body: notification.text,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200, 100, 200],
          requireInteraction: true,
          silent: false,
          tag: `notification-${notification.id}`,
          data: {
            notificationId: notification.id,
            type: 'scheduled',
            timestamp: Date.now()
          }
        };

        await self.registration.showNotification('🔔 Bildirim Sistemi', options);
        
        // Bildirimi gönderildi olarak işaretle
        notification.sent = true;
        await updateNotificationInIndexedDB(notification);
        
        console.log('Service Worker: Bildirim gönderildi ve işaretlendi');
      }
    }
  } catch (error) {
    console.error('Service Worker: Bildirim kontrolü hatası:', error);
  }
}

// IndexedDB'den bildirimleri al
async function getNotificationsFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BildirimDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['notifications'], 'readonly');
      const store = transaction.objectStore('notifications');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' });
      }
    };
  });
}

// IndexedDB'de bildirimi güncelle
async function updateNotificationInIndexedDB(notification) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BildirimDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const putRequest = store.put(notification);
      
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
  });
}

// Message event (ana uygulamadan gelen mesajlar)
self.addEventListener('message', event => {
  console.log('Service Worker mesaj alındı:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'REGISTER_BACKGROUND_SYNC') {
    // Background sync'i kaydet
    self.registration.sync.register('notification-sync')
      .then(() => {
        console.log('Background sync kaydedildi');
      })
      .catch(error => {
        console.error('Background sync kayıt hatası:', error);
      });
  }
});

// Periodic background sync (Chrome'da)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'notification-check') {
    event.waitUntil(checkScheduledNotificationsInSW());
  }
});

console.log('Service Worker v2.1.0 yüklendi - Uygulama kapalıyken bildirim sistemi hazır');