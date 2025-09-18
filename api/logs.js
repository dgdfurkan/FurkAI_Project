// Vercel Backend Logları - Sistem durumu takibi
const logs = [];

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Log kaydet
    const { level, message, data, timestamp } = req.body;
    const logEntry = {
      id: Date.now(),
      level: level || 'info',
      message: message || 'No message',
      data: data || {},
      timestamp: timestamp || new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    };
    
    logs.push(logEntry);
    
    // Son 100 log'u tut
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    console.log(`[${logEntry.level.toUpperCase()}] ${logEntry.message}`, logEntry.data);
    
    res.status(200).json({ 
      success: true, 
      message: 'Log kaydedildi',
      logId: logEntry.id
    });
    
  } else if (req.method === 'GET') {
    // Logları getir
    const { level, limit = 50 } = req.query;
    
    let filteredLogs = logs;
    if (level) {
      filteredLogs = logs.filter(log => log.level === level);
    }
    
    // Son N log'u getir
    const recentLogs = filteredLogs.slice(-parseInt(limit));
    
    res.status(200).json({
      success: true,
      logs: recentLogs,
      total: logs.length,
      filtered: filteredLogs.length,
      timestamp: new Date().toISOString()
    });
    
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
