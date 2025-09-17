// Service Worker kaydı
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/FurkAI_Project/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// DOM elementleri
const requestPermissionBtn = document.getElementById('requestPermission');
const permissionStatus = document.getElementById('permissionStatus');
const notificationForm = document.getElementById('notificationForm');
const savedNotifications = document.getElementById('savedNotifications');
const testNotificationBtn = document.getElementById('testNotification');
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

// Bildirim izni isteme
requestPermissionBtn.addEventListener('click', async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
        // iPhone Safari için gerçek bildirim izni isteme
        if ('Notification' in window) {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    alert('✅ Bildirim izni verildi! Artık WhatsApp gibi gerçek push bildirimleri alacaksınız.');
                    checkNotificationPermission();
                } else if (permission === 'denied') {
                    alert('❌ Bildirim izni reddedildi. iPhone Ayarlar > Safari > Web Sitesi Ayarları > Bildirimler\'den manuel olarak izin verin.');
                    checkNotificationPermission();
                }
            } catch (error) {
                alert('iPhone Safari\'de bildirim izni için:\n\n1. iPhone Ayarlar > Safari > Web Site Ayarları\n2. Bildirimler bölümüne gidin\n3. Bu site için "İzin Ver" seçin\n4. Sayfayı yenileyin');
            }
        }
        return;
    }
    
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        checkNotificationPermission();
    }
});

// Test bildirimi gönderme
testNotificationBtn.addEventListener('click', () => {
    if (Notification.permission === 'granted') {
        // WhatsApp gibi gerçek test bildirimi
        const testNotification = new Notification('🔔 Test Bildirimi', {
            body: 'Bu bir test bildirimidir! WhatsApp gibi gerçek push bildirim.',
            icon: '/FurkAI_Project/icon-192.png',
            badge: '/FurkAI_Project/icon-192.png',
            vibrate: [200, 100, 200, 100, 200], // WhatsApp gibi titreşim
            requireInteraction: true, // Otomatik kapanmasın
            silent: false, // Ses çıkar
            tag: 'test-notification',
            data: {
                type: 'test',
                timestamp: Date.now()
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
        });

        // Bildirim tıklama olayı
        testNotification.onclick = function() {
            window.focus();
            testNotification.close();
        };

        // Bildirim gösterildiğinde log
        testNotification.onshow = function() {
            console.log('Test bildirimi gösterildi');
        };
    } else {
        alert('Önce bildirim izni vermeniz gerekiyor!');
    }
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
    
    alert('Bildirim başarıyla kaydedildi!');
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
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const currentDay = now.getDay();
    
    notifications.forEach(notification => {
        if (notification.time === currentTime && notification.days.includes(currentDay)) {
            // Daha önce bu bildirim gönderilmiş mi kontrol et
            const lastSentKey = `lastSent_${notification.id}_${currentDay}_${currentTime}`;
            const lastSent = localStorage.getItem(lastSentKey);
            const now = Date.now();
            
            // Eğer bu bildirim bugün bu saatte daha önce gönderilmemişse
            if (!lastSent || (now - parseInt(lastSent)) > 60000) { // 1 dakika tolerans
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
                        console.log('Zamanlanmış bildirim gösterildi:', notification.text);
                        // Bu bildirimin gönderildiğini kaydet
                        localStorage.setItem(lastSentKey, now.toString());
                    };
                }
            }
        }
    });
}

// Hatırlatma fonksiyonları kaldırıldı - artık gerçek push bildirimler kullanılıyor

// Her dakika kontrol et - gerçek push bildirimler için
setInterval(checkScheduledNotifications, 60000);

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', () => {
    checkNotificationPermission();
    displayNotifications();
    
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
