import webpush from 'web-push';

// VAPID anahtarları
const VAPID_PUBLIC_KEY = 'BA3KGwqP394aU3744mP7wAWGNhd6t8zIyWNzNx38my-Ki8l5qVq59NNrQsu9GAo7lyQNWtK4rWX63ynRyxoNhy4';
const VAPID_PRIVATE_KEY = 'u7Z2oLS3Hk8OMOYNUA7q67WwavyP-NobFW2tgBnGGfo';

webpush.setVapidDetails(
  'mailto:bildirim@furkai.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, body, url, icon, badge } = req.body;
    
    // Payload oluştur
    const payload = JSON.stringify({
      title: title || '🔔 Bildirim',
      body: body || 'Yeni bildirim!',
      url: url || '/',
      icon: icon || '/icon-192.png',
      badge: badge || '/icon-192.png',
      timestamp: Date.now()
    });

    // Burada gerçek veritabanından abonelikleri alacaksınız
    // Şimdilik test için boş array
    const subscriptions = [];

    if (subscriptions.length === 0) {
      return res.status(200).json({ 
        message: 'Test bildirimi hazırlandı',
        note: 'Henüz aktif abonelik yok'
      });
    }

    const results = [];
    
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(subscription, payload);
        results.push({ success: true, endpoint: subscription.endpoint });
        console.log('Bildirim gönderildi:', subscription.endpoint);
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message,
          endpoint: subscription.endpoint
        });
        console.error('Bildirim gönderme hatası:', error.message);
      }
    }
    
    res.status(200).json({ 
      message: 'Bildirimler gönderildi',
      results: results,
      total: results.length
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
