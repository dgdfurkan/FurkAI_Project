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
    const { subscription, timezone } = req.body;
    
    if (!subscription) {
      return res.status(400).json({ error: 'Subscription required' });
    }

    // Subscription'ı veritabanına kaydet (şimdilik memory'de)
    // Gerçek projede veritabanı kullanın
    const subscriptionData = {
      subscription,
      timezone: timezone || 'Europe/Istanbul',
      createdAt: new Date().toISOString()
    };

    // Burada gerçek veritabanına kaydetme işlemi yapılacak
    console.log('Yeni abonelik kaydedildi:', subscription.endpoint);

    res.status(200).json({ 
      success: true, 
      message: 'Abonelik başarıyla kaydedildi',
      publicKey: VAPID_PUBLIC_KEY
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
