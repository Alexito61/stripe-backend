const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    console.log('🔍 PRODUCCIÓN - Verificando configuración...');
    console.log('🔍 STRIPE_SECRET_KEY empieza con:', process.env.STRIPE_SECRET_KEY?.substring(0, 12));
    
    // PROBAR CON UN SOLO PRODUCTO CONOCIDO
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: "price_1SL3BOCTiyXj8CRZElUtDnTX", // Base Website
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `https://yourapp.com/success`,
      cancel_url: `https://yourapp.com/cancel`,
    });

    console.log('✅ PRODUCCIÓN - ¡ÉXITO! Sesión creada:', session.id);
    console.log('✅ URL de Checkout:', session.url);

    res.status(200).json({ 
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('❌ PRODUCCIÓN - ERROR DETALLADO:');
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Tipo:', error.type);
    console.error('❌ Código:', error.code);
    console.error('❌ Parámetro:', error.param);
    
    // Error específico para Price IDs
    if (error.code === 'resource_missing') {
      console.error('❌ El Price ID no existe en modo LIVE');
    }
    
    res.status(500).json({ 
      success: false,
      error: `Error: ${error.message} (${error.code})`,
      details: `Probablemente el Price ID no existe en modo LIVE`
    });
  }
};
