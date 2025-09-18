// VAPID Public Key (Backend'den alınacak)
const VAPID_PUBLIC_KEY = 'BA3KGwqP394aU3744mP7wAWGNhd6t8zIyWNzNx38my-Ki8l5qVq59NNrQsu9GAo7lyQNWtK4rWX63ynRyxoNhy4'; // Örnek key

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
    await fetch('https://bildirim-backend-d47d.onrender.com/subscribe', {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify({ 
        subscription: sub, 
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone 
      })
    });
    console.log('Push aboneliği backend\'e kaydedildi');
  } catch (error) {
    console.log('Backend bağlantı hatası:', error);
  }
}

// Service Worker kaydı ve VAPID aboneliği
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const reg = await navigator.serviceWorker.register('/FurkAI_Project/sw.js', { 
      scope: '/FurkAI_Project/' 
    });
    console.log('SW registered: ', reg);
    
    if (Notification.permission === 'granted') {
      await ensurePushSubscription(reg);
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
const currentReminders = document.getElementById('currentReminders');
const refreshRemindersBtn = document.getElementById('refreshReminders');

// Bildirim izni kontrolü
function checkNotificationPermission() {
    // iPhone Safari için özel kontrol
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
        // iPhone Safari için gerçek bildirim sistemi
        if ('Notification' in window) {
            const permission = Notification.permission;
            if (permission === 'granted') {
                permissionStatus.innerHTML = '<div class="status success">✅ iPhone Safari bildirim izni verildi! Gerçek push bildirimleri aktif.</div>';
                requestPermissionBtn.style.display = 'none';
            } else if (permission === 'denied') {
                permissionStatus.innerHTML = `
                    <div class="status error">
                        ❌ iPhone Safari bildirim izni reddedildi<br><br>
                        <strong>Çözüm:</strong><br>
                        1. iPhone Ayarlar > Safari > Web Sitesi Ayarları<br>
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
                        <strong>Gerçek bildirimler için izin verin!</strong><br>
                        WhatsApp gibi bildirimler alacaksınız.<br><br>
                        <strong>Not:</strong> iPhone Safari'de bazen bildirimler gecikebilir.
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
            permissionStatus.innerHTML = '<div class="status success">✅ Bildirim izni verildi! Gerçek push bildirimleri aktif.</div>';
            requestPermissionBtn.style.display = 'none';
        } else if (permission === 'denied') {
            permissionStatus.innerHTML = '<div class="status error">❌ Bildirim izni reddedildi. Tarayıcı ayarlarından izin verin.</div>';
            requestPermissionBtn.style.display = 'none';
        } else {
            permissionStatus.innerHTML = '<div class="status info">ℹ️ Gerçek push bildirimleri için izin verin</div>';
            requestPermissionBtn.style.display = 'block';
            requestPermissionBtn.textContent = 'Bildirim İzni Ver';
        }
    } else {
        permissionStatus.innerHTML = '<div class="status error">❌ Bu tarayıcı push bildirimleri desteklemiyor</div>';
        requestPermissionBtn.style.display = 'none';
    }
}

// Bildirim izni isteme ve VAPID aboneliği
requestPermissionBtn.addEventListener('click', async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if ('Notification' in window) {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                // Service Worker'ı al ve VAPID aboneliği oluştur
                const reg = await navigator.serviceWorker.ready;
                await ensurePushSubscription(reg);
                
                if (isIOS && isSafari) {
                    alert('✅ iPhone Safari bildirim izni verildi! Gerçek push bildirimleri aktif.');
                } else {
                    alert('✅ Bildirim izni verildi! Gerçek push bildirimleri aktif.');
                }
                checkNotificationPermission();
            } else if (permission === 'denied') {
                if (isIOS && isSafari) {
                    alert('❌ Bildirim izni reddedildi. iPhone Ayarlar > Safari > Web Sitesi Ayarları > Bildirimler\'den manuel olarak izin verin.');
                } else {
                    alert('❌ Bildirim izni reddedildi. Tarayıcı ayarlarından izin verin.');
                }
                checkNotificationPermission();
            }
        } catch (error) {
            if (isIOS && isSafari) {
                alert('iPhone Safari\'de bildirim izni için:\n\n1. iPhone Ayarlar > Safari > Web Site Ayarları\n2. Bildirimler bölümüne gidin\n3. Bu site için "İzin Ver" seçin\n4. Sayfayı yenileyin');
            } else {
                alert('Bildirim izni alınamadı. Lütfen tarayıcı ayarlarını kontrol edin.');
            }
        }
    }
});

// Test bildirimi gönderme (Backend'e push gönder)
testNotificationBtn.addEventListener('click', async () => {
    if (Notification.permission === 'granted') {
        try {
            // Backend'e test bildirimi gönder
            const response = await fetch('https://bildirim-backend-d47d.onrender.com/send', {
                method: 'POST',
                headers: {'content-type':'application/json'},
                body: JSON.stringify({
                    title: '🔔 Test Bildirimi',
                    body: 'Bu bir test bildirimidir! WhatsApp gibi gerçek push bildirim.',
                    url: '/FurkAI_Project/'
                })
            });
            
            if (response.ok) {
                alert('✅ Test bildirimi backend\'e gönderildi! Push bildirimi gelmelidir.');
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
    const currentDay = turkeyTime.getDay();
    
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    
    alert(`🕐 Saat Kontrolü:\n\nTürkiye Saati: ${currentTime}\nGün: ${dayNames[currentDay]}\n\nBildirimleriniz bu saatte çalışacak.`);
    
    // Bildirim kontrolünü manuel çalıştır
    checkScheduledNotifications();
});

// Bildirim formu işleme
notificationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const text = document.getElementById('notificationText').value;
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
    
    alert('Bildirim başarıyla kaydedildi! Alarm sistemi aktif.');
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
    }
}

// Zamanlanmış bildirimleri kontrol etme
function checkScheduledNotifications() {
    const notifications = loadNotifications();
    
    // Türkiye saati için düzeltme
    const now = new Date();
    const turkeyTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
    const currentTime = turkeyTime.getHours().toString().padStart(2, '0') + ':' + turkeyTime.getMinutes().toString().padStart(2, '0');
    const currentDay = turkeyTime.getDay();
    
    // Debug bilgisi
    console.log('Bildirim kontrolü:', {
        currentTime: currentTime,
        currentDay: currentDay,
        notifications: notifications.length
    });
    
    notifications.forEach((notification, index) => {
        console.log(`Bildirim ${index + 1}:`, {
            text: notification.text,
            time: notification.time,
            days: notification.days,
            currentTime: currentTime,
            currentDay: currentDay,
            timeMatch: notification.time === currentTime,
            dayMatch: notification.days.includes(currentDay)
        });
        
        if (notification.time === currentTime && notification.days.includes(currentDay)) {
            // Daha önce bu bildirim gönderilmiş mi kontrol et
            const lastSentKey = `lastSent_${notification.id}_${currentDay}_${currentTime}`;
            const lastSent = localStorage.getItem(lastSentKey);
            const now = Date.now();
            
            // Eğer bu bildirim bugün bu saatte daha önce gönderilmemişse
            if (!lastSent || (now - parseInt(lastSent)) > 60000) { // 1 dakika tolerans
                console.log('Bildirim gönderiliyor:', notification.text);
                console.log('Bildirim izni:', Notification.permission);
                // Gerçek push bildirimi gönder
                if (Notification.permission === 'granted') {
                    // WhatsApp gibi gerçek bildirim
                    const notificationOptions = {
                        body: notification.text,
                        icon: '/FurkAI_Project/icon-192.png',
                        badge: '/FurkAI_Project/icon-192.png',
                        vibrate: [200, 100, 200, 100, 200], // WhatsApp gibi titreşim
                        requireInteraction: true, // Otomatik kapanmasın
                        silent: false, // Ses çıkar
                        tag: `scheduled-${notification.id}-${currentDay}`, // Benzersiz tag
                        data: {
                            notificationId: notification.id,
                            type: 'scheduled',
                            timestamp: now
                        },
                        actions: [
                            {
                                action: 'view',
                                title: 'Görüntüle',
                                icon: '/FurkAI_Project/icon-192.png'
                            },
                            {
                                action: 'dismiss',
                                title: 'Kapat',
                                icon: '/FurkAI_Project/icon-192.png'
                            }
                        ]
                    };

                    // Gerçek push bildirimi oluştur
                    const pushNotification = new Notification('🔔 Zamanlanmış Bildirim', notificationOptions);
                    
                    // Bildirim tıklama olayı
                    pushNotification.onclick = function() {
                        window.focus();
                        pushNotification.close();
                    };

                    // Bildirim hatası kontrolü
                    pushNotification.onerror = function(error) {
                        console.error('Bildirim hatası:', error);
                    };

                    // Bildirim gösterildiğinde log ve kaydet
                    pushNotification.onshow = function() {
                        console.log('✅ Zamanlanmış bildirim gösterildi:', notification.text);
                        // Bu bildirimin gönderildiğini kaydet
                        localStorage.setItem(lastSentKey, now.toString());
                    };
                    
                    console.log('Bildirim oluşturuldu:', notification.text);
                } else {
                    console.log('❌ Bildirim izni yok:', Notification.permission);
                }
            } else {
                console.log('Bildirim daha önce gönderilmiş:', lastSent);
            }
        } else {
            console.log('Bildirim eşleşmedi:', {
                timeMatch: notification.time === currentTime,
                dayMatch: notification.days.includes(currentDay)
            });
        }
    });
}

// Hatırlatma fonksiyonları kaldırıldı - artık gerçek push bildirimler kullanılıyor

// Her 30 saniyede kontrol et - gerçek push bildirimler için
setInterval(checkScheduledNotifications, 30000);

// iPhone Safari PWA için alarm sistemi
function setupNotificationAlarms() {
    const notifications = loadNotifications();
    const now = new Date();
    const turkeyTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
    const currentDay = turkeyTime.getDay();
    
    notifications.forEach(notification => {
        if (notification.days.includes(currentDay)) {
            // Bildirim saatini hesapla
            const [hours, minutes] = notification.time.split(':');
            const alarmTime = new Date(turkeyTime);
            alarmTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            // Eğer alarm saati geçmişse, yarın için ayarla
            if (alarmTime <= turkeyTime) {
                alarmTime.setDate(alarmTime.getDate() + 1);
            }
            
            const timeUntilAlarm = alarmTime.getTime() - turkeyTime.getTime();
            
            if (timeUntilAlarm > 0 && timeUntilAlarm < 24 * 60 * 60 * 1000) { // 24 saat içinde
                console.log(`Bildirim alarmı kuruldu: ${notification.text} - ${notification.time}`);
                
                setTimeout(() => {
                    if (Notification.permission === 'granted') {
                        const pushNotification = new Notification('🔔 Zamanlanmış Bildirim', {
                            body: notification.text,
                            icon: '/FurkAI_Project/icon-192.png',
                            badge: '/FurkAI_Project/icon-192.png',
                            vibrate: [200, 100, 200, 100, 200],
                            requireInteraction: true,
                            silent: false,
                            tag: `alarm-${notification.id}`,
                            data: {
                                notificationId: notification.id,
                                type: 'scheduled',
                                timestamp: Date.now()
                            }
                        });
                        
                        pushNotification.onclick = function() {
                            window.focus();
                            pushNotification.close();
                        };
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
    setupNotificationAlarms(); // Alarm sistemini başlat
    
    // PWA kurulumu için özel mesaj
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Kurulum butonu göster
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
    alert('Uygulama ana ekranınıza eklendi!');
});

