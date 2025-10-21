export default async function handler(req, res) {
  // Configurar CORS - MÁS COMPLETO
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Manejar OPTIONS explícitamente
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request recibido');
    return res.status(200).end();
  }

  // Solo permitir POST para el endpoint principal
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lineItems } = req.body;
    
    console.log('POST request recibido:', { lineItems });
    
    // Respuesta de prueba exitosa
    return res.status(200).json({
      success: true,
      checkoutUrl: 'https://checkout.stripe.com/test',
      message: '✅ Backend funcionando correctamente'
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
