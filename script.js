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

// Service Worker kaydı - iPhone Safari uyumlu
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
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

// Bildirim izni kontrolü
function checkNotificationPermission() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  
  if (isIOS && isSafari) {
    if ('Notification' in window) {
      const permission = Notification.permission;
      if (permission === 'granted') {
        permissionStatus.innerHTML = '<div class="status success">✅ iPhone Safari bildirim izni verildi! Canlı push bildirimleri aktif.</div>';
        requestPermissionBtn.style.display = 'none';
      } else if (permission === 'denied') {
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
        requestPermissionBtn.textContent = 'iPhone Ayarları';
      } else {
        permissionStatus.innerHTML = `
          <div class="status info">
            📱 iPhone Safari Push Bildirimleri<br><br>
            <strong>Canlı bildirimler için izin verin!</strong><br>
            WhatsApp gibi gerçek bildirimler alacaksınız.
          </div>
        `;
        requestPermissionBtn.style.display = 'block';
        requestPermissionBtn.textContent = 'Bildirim İzni Ver';
      }
    } else {
      permissionStatus.innerHTML = '<div class="status error">❌ Bu iPhone Safari sürümü bildirimleri desteklemiyor</div>';
      requestPermissionBtn.style.display = 'none';
    }
    return;
  }
  
  if ('Notification' in window) {
    const permission = Notification.permission;
    if (permission === 'granted') {
      permissionStatus.innerHTML = '<div class="status success">✅ Bildirim izni verildi! Canlı push bildirimleri aktif.</div>';
      requestPermissionBtn.style.display = 'none';
    } else if (permission === 'denied') {
      permissionStatus.innerHTML = '<div class="status error">❌ Bildirim izni reddedildi. Tarayıcı ayarlarından izin verin.</div>';
      requestPermissionBtn.style.display = 'none';
    } else {
      permissionStatus.innerHTML = '<div class="status info">ℹ️ Canlı push bildirimleri için izin verin</div>';
      requestPermissionBtn.style.display = 'block';
      requestPermissionBtn.textContent = 'Bildirim İzni Ver';
    }
  } else {
    permissionStatus.innerHTML = '<div class="status error">❌ Bu tarayıcı push bildirimleri desteklemiyor</div>';
    requestPermissionBtn.style.display = 'none';
  }
}

// Bildirim izni isteme
requestPermissionBtn.addEventListener('click', async () => {
  if ('Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        await ensurePushSubscription(reg);
        alert('✅ Bildirim izni verildi! Canlı push bildirimleri aktif.');
        checkNotificationPermission();
      } else {
        alert('❌ Bildirim izni reddedildi. Tarayıcı ayarlarından izin verin.');
        checkNotificationPermission();
      }
    } catch (error) {
      alert('❌ Bildirim izni alınamadı. Lütfen tarayıcı ayarlarını kontrol edin.');
    }
  }
});

// Test bildirimi gönderme
testNotificationBtn.addEventListener('click', async () => {
  if (Notification.permission === 'granted') {
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify({
          title: '🔔 Test Bildirimi',
          body: 'Bu bir test bildirimidir! Canlı push bildirim.',
          url: '/'
        })
      });
      
      if (response.ok) {
        // Yerel test bildirimi de göster
        new Notification('🔔 Test Bildirimi', {
          body: 'Test bildirimi başarılı! Canlı sistem çalışıyor.',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200],
          requireInteraction: true
        });
        alert('✅ Test bildirimi gönderildi! Canlı sistem çalışıyor.');
      } else {
        alert('❌ Backend hatası. Lütfen daha sonra tekrar deneyin.');
      }
    } catch (error) {
      console.log('Backend bağlantı hatası:', error);
      alert('❌ Backend bağlantı hatası. Lütfen daha sonra tekrar deneyin.');
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

// Bildirim formu işleme
notificationForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const text = document.getElementById('notificationText').value;
  const date = document.getElementById('notificationDate').value;
  const time = document.getElementById('notificationTime').value;
  const dayCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
  
  if (dayCheckboxes.length === 0) {
    alert('En az bir gün seçmelisiniz!');
    return;
  }
  
  const days = Array.from(dayCheckboxes).map(cb => parseInt(cb.value));
  
  const notification = {
    id: Date.now(),
    text: text,
    date: date,
    time: time,
    days: days,
    createdAt: new Date().toISOString()
  };
  
  saveNotification(notification);
  displayNotifications();
  
  // Formu temizle
  notificationForm.reset();
  
  // Alarm sistemini yeniden kur
  setupNotificationAlarms();
  
  alert('✅ Bildirim başarıyla kaydedildi! Canlı alarm sistemi aktif.');
});

// Bildirimleri localStorage'a kaydetme
function saveNotification(notification) {
  let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  notifications.push(notification);
  localStorage.setItem('notifications', JSON.stringify(notifications));
}

// Bildirimleri localStorage'dan yükleme
function loadNotifications() {
  return JSON.parse(localStorage.getItem('notifications') || '[]');
}

// Bildirimleri ekranda gösterme
function displayNotifications() {
  const notifications = loadNotifications();
  
  if (notifications.length === 0) {
    savedNotifications.innerHTML = '<p class="no-notifications">Henüz kayıtlı bildirim yok</p>';
    return;
  }
  
  savedNotifications.innerHTML = notifications.map(notification => {
    const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const selectedDays = notification.days.map(day => dayNames[day]).join(', ');
    
    return `
      <div class="notification-item">
        <div class="notification-info">
          <div class="notification-text">${notification.text}</div>
          <div class="notification-time">🕐 ${notification.time}</div>
          <div class="notification-date">📅 ${notification.date || 'Her gün'}</div>
          <div class="notification-days">📅 ${selectedDays}</div>
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

// Zamanlanmış bildirimleri kontrol etme
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
      dateMatch
    });
    
    if (timeMatch && dayMatch && dateMatch) {
      const lastSentKey = `lastSent_${notification.id}_${currentDay}_${currentTime}`;
      const lastSent = localStorage.getItem(lastSentKey);
      const now = Date.now();
      
      if (!lastSent || (now - parseInt(lastSent)) > 60000) {
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
            localStorage.setItem(lastSentKey, now.toString());
          };
          
          pushNotification.onerror = function(error) {
            console.error('Bildirim hatası:', error);
          };
        }
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

// Versiyon numarasını göster
document.addEventListener('DOMContentLoaded', () => {
  const versionElement = document.createElement('div');
  versionElement.innerHTML = '<p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">Bildirim Sistemi v2.0.0</p>';
  document.querySelector('footer').appendChild(versionElement);
});