import express from 'express';
import webpush from 'web-push';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// VAPID anahtarları (gerçek projede environment variables kullanın)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0FyHXQwU7H5s';
const VAPID_PRIVATE_KEY = 'your-private-key-here';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Basit bellek depolama (prod'da veritabanı kullanın)
const subscriptions = new Set();

// Abonelik kaydetme
app.post('/subscribe', (req, res) => {
  const subscription = req.body.subscription;
  if (subscription) {
    subscriptions.add(JSON.stringify(subscription));
    console.log('Yeni abonelik kaydedildi:', subscription.endpoint);
    res.status(201).json({ success: true });
  } else {
    res.status(400).json({ error: 'Geçersiz abonelik' });
  }
});

// Push bildirimi gönderme
app.post('/send', async (req, res) => {
  const { title, body, url } = req.body;
  
  const payload = JSON.stringify({
    title: title || 'Bildirim Sistemi',
    body: body || 'Yeni bildirim!',
    url: url || '/FurkAI_Project/'
  });

  const results = [];
  
  for (const subscriptionStr of subscriptions) {
    try {
      const subscription = JSON.parse(subscriptionStr);
      await webpush.sendNotification(subscription, payload);
      results.push({ success: true, endpoint: subscription.endpoint });
      console.log('Bildirim gönderildi:', subscription.endpoint);
    } catch (error) {
      results.push({ 
        success: false, 
        error: error.message,
        endpoint: JSON.parse(subscriptionStr).endpoint
      });
      console.error('Bildirim gönderme hatası:', error.message);
    }
  }
  
  res.json({ 
    message: 'Bildirimler gönderildi',
    results: results,
    total: results.length
  });
});

// Zamanlanmış bildirimler için CRON endpoint
app.post('/schedule', async (req, res) => {
  const { time, days, text } = req.body;
  
  // Bu endpoint CRON job'ları tarafından çağrılacak
  const payload = JSON.stringify({
    title: '🔔 Zamanlanmış Bildirim',
    body: text || 'Zamanlanmış bildirim!',
    url: '/FurkAI_Project/'
  });

  const results = [];
  
  for (const subscriptionStr of subscriptions) {
    try {
      const subscription = JSON.parse(subscriptionStr);
      await webpush.sendNotification(subscription, payload);
      results.push({ success: true });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  
  res.json({ 
    message: 'Zamanlanmış bildirimler gönderildi',
    results: results
  });
});

// Abonelik sayısını görüntüleme
app.get('/stats', (req, res) => {
  res.json({ 
    totalSubscriptions: subscriptions.size,
    subscriptions: Array.from(subscriptions).map(s => JSON.parse(s).endpoint)
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend sunucu ${PORT} portunda çalışıyor`);
  console.log(`VAPID Public Key: ${VAPID_PUBLIC_KEY}`);
});
