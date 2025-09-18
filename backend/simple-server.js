import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// Basit test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Backend çalışıyor!' });
});

// Push bildirimi gönderme (basit)
app.post('/send', (req, res) => {
  const { title, body, url } = req.body;
  
  res.json({ 
    message: 'Bildirim gönderildi',
    title: title || 'Test',
    body: body || 'Test bildirimi',
    url: url || '/FurkAI_Project/'
  });
});

// Abonelik kaydetme (basit)
app.post('/subscribe', (req, res) => {
  res.json({ message: 'Abonelik kaydedildi' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend sunucu ${PORT} portunda çalışıyor`);
});