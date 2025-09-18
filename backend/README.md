# Bildirim Backend

Bu backend, Web Push bildirimleri için VAPID anahtarları ile çalışır.

## Kurulum

1. VAPID anahtarları oluşturun:
```bash
npx web-push generate-vapid-keys
```

2. Environment variables ayarlayın:
```bash
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

3. Bağımlılıkları yükleyin:
```bash
npm install
```

4. Sunucuyu başlatın:
```bash
npm start
```

## Vercel'e Deploy

1. Vercel CLI ile:
```bash
vercel
```

2. Environment variables'ları Vercel dashboard'dan ekleyin

## Endpoints

- `POST /subscribe` - Push aboneliği kaydet
- `POST /send` - Tüm abonelere bildirim gönder
- `POST /schedule` - Zamanlanmış bildirim gönder
- `GET /stats` - Abonelik istatistikleri

## Test

```bash
curl -X POST https://your-backend.vercel.app/send \
  -H "content-type: application/json" \
  -d '{"title":"Test","body":"Test bildirimi","url":"/FurkAI_Project/"}'
```
