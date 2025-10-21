export default function handler(req, res) {
  console.log('✅ Simple-test called, method:', req.method);
  
  // CORS completo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS preflight handled');
    return res.status(200).end();
  }
  
  console.log('✅ POST request received');
  
  return res.status(200).json({ 
    success: true,
    message: '✅ Simple test working!',
    method: req.method,
    timestamp: new Date().toISOString()
  });
}
