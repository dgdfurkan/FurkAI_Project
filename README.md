# 🔔 Bildirim Sistemi v2.0.0

**Canlı Bildirim Sistemi - Tarih ve Saat Desteği ile Tam Çalışan Sistem**

## ✨ Özellikler

- **Canlı Push Bildirimleri**: WhatsApp gibi gerçek push bildirimleri
- **Tarih ve Saat Desteği**: Tam tarih/saat seçimi ile zamanlanmış bildirimler
- **iPhone Safari Uyumlu**: iPhone Safari'de tam çalışan bildirim sistemi
- **PWA Desteği**: Ana ekrana eklenebilir uygulama
- **Offline Çalışma**: İnternet bağlantısı olmadan da çalışır
- **Versiyon Takibi**: Her güncellemede versiyon numarası

## 🚀 Kurulum

### Vercel ile Deploy

1. Bu projeyi GitHub'a yükleyin
2. Vercel'e bağlayın
3. Otomatik olarak deploy edilir

### Manuel Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build
```

## 📱 Kullanım

1. **Bildirim İzni Verin**: İlk açılışta bildirim izni verin
2. **Bildirim Oluşturun**: 
   - Bildirim metnini girin
   - Tarih seçin (opsiyonel - boş bırakırsanız her gün çalışır)
   - Saat seçin
   - Günleri seçin
3. **Ana Ekrana Ekleyin**: iPhone Safari'de "Ana Ekrana Ekle" butonunu kullanın

## 🔧 Teknik Detaylar

### Backend (Vercel Functions)
- `/api/subscribe` - Push abonelik kaydı
- `/api/send` - Test bildirimi gönderme
- `/api/schedule` - Zamanlanmış bildirim gönderme

### Frontend
- **Service Worker**: Offline çalışma ve push bildirimleri
- **PWA**: Ana ekrana eklenebilir uygulama
- **LocalStorage**: Bildirim verilerini saklama
- **Türkiye Saati**: Otomatik saat dilimi ayarı

### iPhone Safari Optimizasyonları
- Özel meta tag'ler
- Optimize edilmiş bildirim ayarları
- Fallback mekanizmaları
- PWA kurulum rehberi

## 📋 Versiyon Geçmişi

### v2.0.0 (Mevcut)
- ✅ Tarih ve saat desteği eklendi
- ✅ Vercel Functions ile backend yenilendi
- ✅ iPhone Safari optimizasyonları
- ✅ Versiyon numarası sistemi
- ✅ Gereksiz kodlar temizlendi
- ✅ Canlı bildirim sistemi

### v1.0.0
- İlk sürüm
- Temel bildirim sistemi

## 🐛 Sorun Giderme

### iPhone Safari'de Bildirimler Gelmiyor
1. iPhone Ayarlar > Safari > Web Site Ayarları
2. Bildirimler bölümüne gidin
3. Bu site için "İzin Ver" seçin
4. Sayfayı yenileyin

### Bildirimler Gecikiyor
- iPhone Safari'de bazen bildirimler 1-2 dakika gecikebilir
- Bu normal bir durumdur ve sistem çalışmaya devam eder

### Ana Ekrana Ekleme
1. Safari'de sayfayı açın
2. Paylaş butonuna basın
3. "Ana Ekrana Ekle" seçin
4. Uygulama ana ekranınıza eklenecek

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Tarayıcı konsolunu kontrol edin
2. Bildirim izinlerini kontrol edin
3. İnternet bağlantınızı kontrol edin

## 🔒 Gizlilik

- Tüm veriler tarayıcınızda saklanır
- Hiçbir kişisel veri sunucuya gönderilmez
- Push abonelik verileri sadece bildirim göndermek için kullanılır

---

**Bildirim Sistemi v2.0.0** - Canlı bildirimler için tasarlandı! 🚀