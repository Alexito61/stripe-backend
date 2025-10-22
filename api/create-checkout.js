const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lineItems, mode = 'payment' } = req.body;

    console.log('💰 STRIPE - Modo solicitado:', mode);
    console.log('💰 STRIPE - Número de items:', lineItems.length);
    console.log('💰 STRIPE - Items:', JSON.stringify(lineItems, null, 2));

    // Validar que el modo sea válido
    if (mode !== 'payment' && mode !== 'subscription') {
      throw new Error('Modo de pago inválido. Debe ser "payment" o "subscription"');
    }

    // Validar que hay items
    if (!lineItems || lineItems.length === 0) {
      throw new Error('No hay items para procesar');
    }

    // Crear sesión de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: mode, // ← 'payment' o 'subscription'
      success_url: `https://yourwebsite.com/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://yourwebsite.com/cancel`,
      customer_email: 'customer@example.com', // Opcional - puedes hacerlo dinámico después
    });

    console.log('✅ STRIPE - Sesión creada exitosamente');
    console.log('✅ STRIPE - ID de sesión:', session.id);
    console.log('✅ STRIPE - Modo:', session.mode);
    console.log('✅ STRIPE - Monto total:', session.amount_total);
    console.log('✅ STRIPE - URL:', session.url);

    res.status(200).json({ 
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      mode: session.mode,
      amountTotal: session.amount_total
    });

  } catch (error) {
    console.error('❌ STRIPE - Error creando sesión:');
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Tipo:', error.type);
    console.error('❌ Código:', error.code);
    
    res.status(500).json({ 
      success: false,
      error: `Error: ${error.message}`,
      code: error.code
    });
  }
};
