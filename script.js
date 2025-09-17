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
        // iPhone Safari için alternatif yaklaşım
        permissionStatus.innerHTML = `
            <div class="status info">
                📱 iPhone Safari Bildirim Sistemi<br><br>
                <strong>iPhone Safari'de bildirimler sınırlıdır.</strong><br>
                Bu uygulama zamanlanmış hatırlatmalar için tasarlanmıştır.<br><br>
                <strong>Kullanım:</strong><br>
                1. Ana ekrana ekleyin<br>
                2. Belirlenen saatlerde uygulamayı açın<br>
                3. Hatırlatmalarınızı görün
            </div>
        `;
        requestPermissionBtn.style.display = 'none';
        return;
    }
    
    if ('Notification' in window) {
        const permission = Notification.permission;
        if (permission === 'granted') {
            permissionStatus.innerHTML = '<div class="status success">✅ Bildirim izni verildi</div>';
            requestPermissionBtn.style.display = 'none';
        } else if (permission === 'denied') {
            permissionStatus.innerHTML = '<div class="status error">❌ Bildirim izni reddedildi. Tarayıcı ayarlarından izin verin.</div>';
            requestPermissionBtn.style.display = 'none';
        } else {
            permissionStatus.innerHTML = '<div class="status info">ℹ️ Bildirim izni gerekli</div>';
            requestPermissionBtn.style.display = 'block';
            requestPermissionBtn.textContent = 'Bildirim İzni Ver';
        }
    } else {
        permissionStatus.innerHTML = `
            <div class="status info">
                ℹ️ Bu tarayıcı push bildirimleri desteklemiyor<br><br>
                <strong>Alternatif:</strong><br>
                Ana ekrana ekleyerek zamanlanmış hatırlatmalar kullanabilirsiniz.
            </div>
        `;
        requestPermissionBtn.style.display = 'none';
    }
}

// Bildirim izni isteme
requestPermissionBtn.addEventListener('click', async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
        // iPhone Safari için özel talimat
        alert('iPhone Safari\'de bildirim izni için:\n\n1. iPhone Ayarlar > Safari > Web Sitesi Ayarları\n2. Bildirimler bölümüne gidin\n3. Bu site için "İzin Ver" seçin\n4. Sayfayı yenileyin');
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
        new Notification('Test Bildirimi', {
            body: 'Bu bir test bildirimidir!',
            icon: '/FurkAI_Project/icon-192.png',
            badge: '/FurkAI_Project/icon-192.png',
            vibrate: [100, 50, 100]
        });
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
            // Bildirimi gönder
            if (Notification.permission === 'granted') {
            new Notification('Zamanlanmış Bildirim', {
                body: notification.text,
                icon: '/FurkAI_Project/icon-192.png',
                badge: '/FurkAI_Project/icon-192.png',
                vibrate: [100, 50, 100],
                tag: `notification-${notification.id}`
            });
            }
        }
    });
}

// Hatırlatmaları güncelle
function updateCurrentReminders() {
    const notifications = loadNotifications();
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const currentDay = now.getDay();
    
    // Bugün için aktif hatırlatmaları bul
    const todayReminders = notifications.filter(notification => {
        return notification.days.includes(currentDay) && notification.time === currentTime;
    });
    
    if (todayReminders.length === 0) {
        currentReminders.innerHTML = '<p class="no-reminders">Şu anda aktif hatırlatma yok</p>';
        return;
    }
    
    const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    
    currentReminders.innerHTML = todayReminders.map(notification => {
        const selectedDays = notification.days.map(day => dayNames[day]).join(', ');
        
        return `
            <div class="reminder-item">
                <div class="reminder-info">
                    <div class="reminder-text">🔔 ${notification.text}</div>
                    <div class="reminder-time">🕐 ${notification.time}</div>
                    <div class="reminder-days">📅 ${selectedDays}</div>
                </div>
                <div class="reminder-status">AKTİF</div>
            </div>
        `;
    }).join('');
}

// Hatırlatmaları yenile butonu
refreshRemindersBtn.addEventListener('click', () => {
    updateCurrentReminders();
    alert('Hatırlatmalar güncellendi!');
});

// Her dakika kontrol et
setInterval(checkScheduledNotifications, 60000);

// Hatırlatmaları da güncelle
setInterval(updateCurrentReminders, 60000);

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', () => {
    checkNotificationPermission();
    displayNotifications();
    updateCurrentReminders();
    
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
