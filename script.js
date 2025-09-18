// Bildirim Sistemi v2.0.0 - Canlı Bildirimler
// Tarih ve Saat Desteği ile Tam Çalışan Sistem

// VAPID Public Key
const VAPID_PUBLIC_KEY = 'BA3KGwqP394aU3744mP7wAWGNhd6t8zIyWNzNx38my-Ki8l5qVq59NNrQsu9GAo7lyQNWtK4rWX63ynRyxoNhy4';

// VAPID key dönüştürme
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

// Push aboneliği oluştur ve backend'e gönder
async function ensurePushSubscription(reg) {
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
  }
  
  // Backend'e aboneliği kaydet
  try {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify({ 
        subscription: sub, 
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone 
      })
    });
    
    if (response.ok) {
      console.log('✅ Push aboneliği backend\'e kaydedildi');
    } else {
      console.log('❌ Backend abonelik hatası');
    }
  } catch (error) {
    console.log('❌ Backend bağlantı hatası:', error);
  }
}

// Service Worker kaydı - iPhone Safari uyumlu + Background Sync
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // IndexedDB'yi başlat
      await initIndexedDB();
      console.log('✅ IndexedDB başlatıldı');
      
      // iPhone Safari için özel scope
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const scope = isIOS ? '/' : '/';
      
      const reg = await navigator.serviceWorker.register('/sw.js', { scope });
      console.log('✅ Service Worker kaydedildi:', reg);
      
      // iPhone Safari için özel bekleme
      if (isIOS) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (Notification.permission === 'granted') {
        await ensurePushSubscription(reg);
        
        // Background sync'i kaydet (Service Worker için)
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          try {
            await reg.sync.register('notification-sync');
            console.log('✅ Background sync kaydedildi');
          } catch (syncError) {
            console.log('Background sync kayıt hatası:', syncError);
          }
        }
        
        // Service Worker'a mesaj gönder
        if (reg.active) {
          reg.active.postMessage({ type: 'REGISTER_BACKGROUND_SYNC' });
        }
      }
    } catch (error) {
      console.log('❌ Service Worker hatası:', error);
      
      // iPhone Safari için fallback
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        console.log('iPhone Safari için fallback modu');
      }
    }
  });
}

// DOM elementleri
const requestPermissionBtn = document.getElementById('requestPermission');
const permissionStatus = document.getElementById('permissionStatus');
const notificationForm = document.getElementById('notificationForm');
const savedNotifications = document.getElementById('savedNotifications');
const testNotificationBtn = document.getElementById('testNotification');
const debugTimeBtn = document.getElementById('debugTime');

// Bildirim izni kontrolü - iPhone Safari uyumlu
function checkNotificationPermission() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  
  console.log('Bildirim izni kontrolü:', {
    isIOS: isIOS,
    isSafari: isSafari,
    permission: Notification.permission
  });
  
  if (isIOS && isSafari) {
    if ('Notification' in window) {
      const permission = Notification.permission;
      console.log('iPhone Safari bildirim izni durumu:', permission);
      
      if (permission === 'granted') {
        console.log('✅ iPhone Safari bildirim izni aktif - UI güncelleniyor');
        permissionStatus.innerHTML = '<div class="status success">✅ iPhone Safari bildirim izni verildi! Canlı push bildirimleri aktif.</div>';
        requestPermissionBtn.style.display = 'none';
        requestPermissionBtn.style.visibility = 'hidden';
        console.log('✅ iPhone Safari bildirim izni aktif - UI güncellendi');
      } else if (permission === 'denied') {
        console.log('❌ iPhone Safari bildirim izni reddedildi');
        permissionStatus.innerHTML = `
          <div class="status error">
            ❌ iPhone Safari bildirim izni reddedildi<br><br>
            <strong>Çözüm:</strong><br>
            1. iPhone Ayarlar > Safari > Web Site Ayarları<br>
            2. Bildirimler bölümüne gidin<br>
            3. Bu site için "İzin Ver" seçin<br>
            4. Sayfayı yenileyin
          </div>
        `;
        requestPermissionBtn.style.display = 'block';
        requestPermissionBtn.style.visibility = 'visible';
        requestPermissionBtn.textContent = 'iPhone Ayarları';
        console.log('❌ iPhone Safari bildirim izni reddedildi - UI güncellendi');
      } else {
        console.log('ℹ️ iPhone Safari bildirim izni bekleniyor');
        permissionStatus.innerHTML = `
          <div class="status info">
            📱 iPhone Safari Push Bildirimleri<br><br>
            <strong>Canlı bildirimler için izin verin!</strong><br>
            WhatsApp gibi gerçek bildirimler alacaksınız.
          </div>
        `;
        requestPermissionBtn.style.display = 'block';
        requestPermissionBtn.style.visibility = 'visible';
        requestPermissionBtn.textContent = 'Bildirim İzni Ver';
        console.log('ℹ️ iPhone Safari bildirim izni bekleniyor - UI güncellendi');
      }
    } else {
      console.log('❌ iPhone Safari bildirim desteklenmiyor');
      permissionStatus.innerHTML = '<div class="status error">❌ Bu iPhone Safari sürümü bildirimleri desteklemiyor</div>';
      requestPermissionBtn.style.display = 'none';
      requestPermissionBtn.style.visibility = 'hidden';
      console.log('❌ iPhone Safari bildirim desteklenmiyor - UI güncellendi');
    }
    return;
  }
  
  if ('Notification' in window) {
    const permission = Notification.permission;
    console.log('Diğer tarayıcı bildirim izni durumu:', permission);
    
    if (permission === 'granted') {
      console.log('✅ Bildirim izni aktif - UI güncelleniyor');
      permissionStatus.innerHTML = '<div class="status success">✅ Bildirim izni verildi! Canlı push bildirimleri aktif.</div>';
      requestPermissionBtn.style.display = 'none';
      requestPermissionBtn.style.visibility = 'hidden';
      console.log('✅ Bildirim izni aktif - UI güncellendi');
    } else if (permission === 'denied') {
      console.log('❌ Bildirim izni reddedildi');
      permissionStatus.innerHTML = '<div class="status error">❌ Bildirim izni reddedildi. Tarayıcı ayarlarından izin verin.</div>';
      requestPermissionBtn.style.display = 'none';
      requestPermissionBtn.style.visibility = 'hidden';
      console.log('❌ Bildirim izni reddedildi - UI güncellendi');
    } else {
      console.log('ℹ️ Bildirim izni bekleniyor');
      permissionStatus.innerHTML = '<div class="status info">ℹ️ Canlı push bildirimleri için izin verin</div>';
      requestPermissionBtn.style.display = 'block';
      requestPermissionBtn.style.visibility = 'visible';
      requestPermissionBtn.textContent = 'Bildirim İzni Ver';
      console.log('ℹ️ Bildirim izni bekleniyor - UI güncellendi');
    }
  } else {
    console.log('❌ Bildirim desteklenmiyor');
    permissionStatus.innerHTML = '<div class="status error">❌ Bu tarayıcı push bildirimleri desteklemiyor</div>';
    requestPermissionBtn.style.display = 'none';
    requestPermissionBtn.style.visibility = 'hidden';
    console.log('❌ Bildirim desteklenmiyor - UI güncellendi');
  }
}

// Bildirim izni isteme - iPhone Safari uyumlu
requestPermissionBtn.addEventListener('click', async () => {
  if ('Notification' in window) {
    try {
      console.log('Bildirim izni isteniyor...');
      
      const permission = await Notification.requestPermission();
      console.log('Bildirim izni sonucu:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Bildirim izni verildi!');
        
        // iPhone Safari için Service Worker'ın hazır olmasını bekle
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          console.log('iPhone Safari tespit edildi, Service Worker bekleniyor...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        try {
          const reg = await navigator.serviceWorker.ready;
          await ensurePushSubscription(reg);
          console.log('Service Worker hazır ve abonelik oluşturuldu');
        } catch (swError) {
          console.log('Service Worker hatası, devam ediliyor:', swError);
        }
        
        // UI'yi hemen güncelle
        console.log('UI güncelleniyor...');
        checkNotificationPermission();
        
        // iPhone Safari için ekstra bekleme ve tekrar kontrol
        if (isIOS) {
          console.log('iPhone Safari için ekstra kontrol yapılıyor...');
          setTimeout(() => {
            console.log('İkinci UI kontrolü yapılıyor...');
            checkNotificationPermission();
          }, 1000);
          
          // Üçüncü kontrol - daha uzun bekleme
          setTimeout(() => {
            console.log('Üçüncü UI kontrolü yapılıyor...');
            checkNotificationPermission();
          }, 3000);
        }
        
        alert('✅ Bildirim izni verildi! Canlı push bildirimleri aktif.');
      } else {
        console.log('❌ Bildirim izni reddedildi');
        alert('❌ Bildirim izni reddedildi. Tarayıcı ayarlarından izin verin.');
        checkNotificationPermission();
      }
    } catch (error) {
      console.log('Bildirim izni hatası:', error);
      alert('❌ Bildirim izni alınamadı. Lütfen tarayıcı ayarlarını kontrol edin.');
    }
  }
});

// Test bildirimi gönderme - iPhone Safari uyumlu
testNotificationBtn.addEventListener('click', async () => {
  if (Notification.permission === 'granted') {
    try {
      // iPhone Safari için özel optimizasyon
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      const notificationOptions = {
        body: 'Test bildirimi başarılı! Canlı sistem çalışıyor.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: isIOS ? [200, 100, 200] : [200, 100, 200, 100, 200],
        requireInteraction: true,
        silent: false,
        tag: 'test-notification',
        data: {
          type: 'test',
          timestamp: Date.now()
        }
      };

      // iPhone Safari için özel başlık
      const title = isIOS && isSafari ? '🔔 Test' : '🔔 Test Bildirimi';
      const testNotification = new Notification(title, notificationOptions);
      
      testNotification.onclick = function() {
        window.focus();
        testNotification.close();
      };

      testNotification.onshow = function() {
        console.log('✅ Test bildirimi gösterildi');
        alert('✅ Test bildirimi başarılı! Canlı sistem çalışıyor.');
      };
      
      testNotification.onerror = function(error) {
        console.error('Test bildirimi hatası:', error);
        alert('❌ Test bildirimi hatası. Lütfen tekrar deneyin.');
      };
      
    } catch (error) {
      console.log('Test bildirimi hatası:', error);
      alert('❌ Test bildirimi hatası. Lütfen tekrar deneyin.');
    }
  } else {
    alert('Önce bildirim izni vermeniz gerekiyor!');
  }
});

// Debug saat kontrolü
debugTimeBtn.addEventListener('click', () => {
  const now = new Date();
  const turkeyTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
  const currentTime = turkeyTime.getHours().toString().padStart(2, '0') + ':' + turkeyTime.getMinutes().toString().padStart(2, '0');
  const currentDate = turkeyTime.toISOString().split('T')[0];
  const currentDay = turkeyTime.getDay();
  
  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  
  alert(`🕐 Saat Kontrolü:\n\nTürkiye Saati: ${currentTime}\nTarih: ${currentDate}\nGün: ${dayNames[currentDay]}\n\nBildirimleriniz bu saatte çalışacak.`);
  
  checkScheduledNotifications();
});

// Bildirim formu işleme - Mantıklı form validasyonu
notificationForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const text = document.getElementById('notificationText').value;
  const date = document.getElementById('notificationDate').value;
  const time = document.getElementById('notificationTime').value;
  const dayCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
  
  // Eğer tarih seçilmişse, gün seçimi gerekli değil
  let days = [];
  if (date) {
    // Tarih seçilmişse, o tarihin gününü hesapla
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    days = [dayOfWeek];
    console.log('Tarih seçildi, gün hesaplandı:', dayOfWeek);
  } else {
    // Tarih seçilmemişse, gün seçimi zorunlu
    if (dayCheckboxes.length === 0) {
      alert('En az bir gün seçmelisiniz veya belirli bir tarih seçmelisiniz!');
      return;
    }
    days = Array.from(dayCheckboxes).map(cb => parseInt(cb.value));
  }
  
  const notification = {
    id: Date.now(),
    text: text,
    date: date,
    time: time,
    days: days,
    createdAt: new Date().toISOString(),
    sent: false // Bildirim gönderilip gönderilmediğini takip et
  };
  
  saveNotification(notification);
  displayNotifications();
  
  // Formu temizle
  notificationForm.reset();
  
  // Alarm sistemini yeniden kur
  setupNotificationAlarms();
  
  alert('✅ Bildirim başarıyla kaydedildi! Canlı alarm sistemi aktif.');
});

// IndexedDB desteği - Uygulama kapalıyken çalışması için
let db;

function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BildirimDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' });
      }
    };
  });
}

// IndexedDB'ye bildirim kaydet
async function saveNotificationToIndexedDB(notification) {
  if (!db) await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    const request = store.put(notification);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// IndexedDB'den bildirimleri al
async function getNotificationsFromIndexedDB() {
  if (!db) await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['notifications'], 'readonly');
    const store = transaction.objectStore('notifications');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Bildirimleri localStorage'a kaydetme - Güncelleme desteği ile
function saveNotification(notification) {
  let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  
  // Eğer bildirim zaten varsa (id ile), güncelle
  const existingIndex = notifications.findIndex(n => n.id === notification.id);
  if (existingIndex !== -1) {
    notifications[existingIndex] = notification;
    console.log('Bildirim güncellendi:', notification.id);
  } else {
    notifications.push(notification);
    console.log('Yeni bildirim eklendi:', notification.id);
  }
  
  localStorage.setItem('notifications', JSON.stringify(notifications));
  
  // IndexedDB'ye de kaydet (Service Worker için)
  saveNotificationToIndexedDB(notification).catch(error => {
    console.log('IndexedDB kayıt hatası:', error);
  });
}

// Bildirimleri localStorage'dan yükleme
function loadNotifications() {
  return JSON.parse(localStorage.getItem('notifications') || '[]');
}

// Bildirimleri ekranda gösterme - Gönderilmiş durumu ile
function displayNotifications() {
  const notifications = loadNotifications();
  
  if (notifications.length === 0) {
    savedNotifications.innerHTML = '<p class="no-notifications">Henüz kayıtlı bildirim yok</p>';
    return;
  }
  
  savedNotifications.innerHTML = notifications.map(notification => {
    const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const selectedDays = notification.days.map(day => dayNames[day]).join(', ');
    
    const statusClass = notification.sent ? 'sent' : 'pending';
    const statusText = notification.sent ? '✅ Gönderildi' : '⏳ Bekliyor';
    
    return `
      <div class="notification-item ${statusClass}">
        <div class="notification-info">
          <div class="notification-text">${notification.text}</div>
          <div class="notification-time">🕐 ${notification.time}</div>
          <div class="notification-date">📅 ${notification.date || 'Her gün'}</div>
          <div class="notification-days">📅 ${selectedDays}</div>
          <div class="notification-status">${statusText}</div>
        </div>
        <button class="delete-btn" onclick="deleteNotification(${notification.id})">Sil</button>
      </div>
    `;
  }).join('');
}

// Bildirim silme
function deleteNotification(id) {
  if (confirm('Bu bildirimi silmek istediğinizden emin misiniz?')) {
    let notifications = loadNotifications();
    notifications = notifications.filter(n => n.id !== id);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    displayNotifications();
    setupNotificationAlarms();
  }
}

// Zamanlanmış bildirimleri kontrol etme - Duplicate önleme ile
function checkScheduledNotifications() {
  const notifications = loadNotifications();
  
  const now = new Date();
  const turkeyTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
  const currentTime = turkeyTime.getHours().toString().padStart(2, '0') + ':' + turkeyTime.getMinutes().toString().padStart(2, '0');
  const currentDate = turkeyTime.toISOString().split('T')[0];
  const currentDay = turkeyTime.getDay();
  
  console.log('Bildirim kontrolü:', {
    currentTime: currentTime,
    currentDate: currentDate,
    currentDay: currentDay,
    notifications: notifications.length
  });
  
  notifications.forEach((notification, index) => {
    // Eğer bildirim daha önce gönderilmişse, atla
    if (notification.sent) {
      console.log(`Bildirim ${index + 1} daha önce gönderilmiş, atlanıyor:`, notification.text);
      return;
    }
    
    const timeMatch = notification.time === currentTime;
    const dayMatch = notification.days.includes(currentDay);
    const dateMatch = !notification.date || notification.date === currentDate;
    
    console.log(`Bildirim ${index + 1}:`, {
      text: notification.text,
      time: notification.time,
      date: notification.date,
      days: notification.days,
      timeMatch,
      dayMatch,
      dateMatch,
      sent: notification.sent
    });
    
    if (timeMatch && dayMatch && dateMatch) {
      console.log('✅ Bildirim gönderiliyor:', notification.text);
      
      if (Notification.permission === 'granted') {
        // iPhone Safari için özel optimizasyon
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        
        const notificationOptions = {
          body: notification.text,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: isIOS ? [200, 100, 200] : [200, 100, 200, 100, 200],
          requireInteraction: true,
          silent: false,
          tag: `scheduled-${notification.id}-${currentDay}`,
          data: {
            notificationId: notification.id,
            type: 'scheduled',
            timestamp: now
          }
        };

        // iPhone Safari için özel başlık
        const title = isIOS && isSafari ? '🔔 Bildirim' : '🔔 Zamanlanmış Bildirim';
        const pushNotification = new Notification(title, notificationOptions);
        
        pushNotification.onclick = function() {
          window.focus();
          pushNotification.close();
        };

        pushNotification.onshow = function() {
          console.log('✅ Zamanlanmış bildirim gösterildi:', notification.text);
          
          // Bildirimi gönderildi olarak işaretle
          notification.sent = true;
          saveNotification(notification);
          
          // UI'yi güncelle
          displayNotifications();
        };
        
        pushNotification.onerror = function(error) {
          console.error('Bildirim hatası:', error);
        };
      }
    }
  });
}

// Alarm sistemi kurulumu
function setupNotificationAlarms() {
  const notifications = loadNotifications();
  const now = new Date();
  const turkeyTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
  const currentDay = turkeyTime.getDay();
  
  notifications.forEach(notification => {
    if (notification.days.includes(currentDay)) {
      const [hours, minutes] = notification.time.split(':');
      const alarmTime = new Date(turkeyTime);
      alarmTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      if (alarmTime <= turkeyTime) {
        alarmTime.setDate(alarmTime.getDate() + 1);
      }
      
      const timeUntilAlarm = alarmTime.getTime() - turkeyTime.getTime();
      
      if (timeUntilAlarm > 0 && timeUntilAlarm < 24 * 60 * 60 * 1000) {
        console.log(`⏰ Bildirim alarmı kuruldu: ${notification.text} - ${notification.time}`);
        
        setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification('🔔 Zamanlanmış Bildirim', {
              body: notification.text,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              vibrate: [200, 100, 200, 100, 200],
              requireInteraction: true,
              silent: false,
              tag: `alarm-${notification.id}`
            });
          }
        }, timeUntilAlarm);
      }
    }
  });
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', () => {
  checkNotificationPermission();
  displayNotifications();
  setupNotificationAlarms();
  
  // PWA kurulumu
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    const installBtn = document.createElement('button');
    installBtn.textContent = '📱 Ana Ekrana Ekle';
    installBtn.className = 'btn btn-primary';
    installBtn.style.marginTop = '10px';
    installBtn.addEventListener('click', () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA kuruldu');
        }
        deferredPrompt = null;
      });
    });
    
    const permissionSection = document.querySelector('.notification-section');
    permissionSection.appendChild(installBtn);
  });
});

// PWA kurulumu tamamlandığında
window.addEventListener('appinstalled', (evt) => {
  console.log('PWA kuruldu');
  alert('✅ Uygulama ana ekranınıza eklendi!');
});

// Her 30 saniyede kontrol et
setInterval(checkScheduledNotifications, 30000);

// Versiyon numarası artık HTML'de sabit olarak gösteriliyor