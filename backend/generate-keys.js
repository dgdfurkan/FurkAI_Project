import webpush from 'web-push';

// VAPID anahtarları oluştur
const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Anahtarları:');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
console.log('');
console.log('Bu anahtarları server.js dosyasında güncelleyin:');
console.log('VAPID_PUBLIC_KEY = \'' + vapidKeys.publicKey + '\';');
console.log('VAPID_PRIVATE_KEY = \'' + vapidKeys.privateKey + '\';');
