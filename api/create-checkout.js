export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    try {
      const { lineItems } = req.body;
      
      console.log('Datos recibidos:', { lineItems });
      
      // Simular respuesta exitosa
      return res.status(200).json({
        success: true,
        checkoutUrl: 'https://checkout.stripe.com/test',
        message: 'Modo prueba - Funcionando correctamente'
      });
      
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Error interno' });
    }
  }
  
  return res.status(405).json({ error: 'Método no permitido' });
}
