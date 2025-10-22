const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { lineItems, mode = 'payment' } = req.body;

    console.log('💰 STRIPE - Modo:', mode);
    console.log('💰 STRIPE - Items:', lineItems.length);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: mode,
      success_url: `https://yourwebsite.com/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://yourwebsite.com/cancel`,
    });

    console.log('✅ STRIPE - Sesión creada:', session.id);

    res.status(200).json({ 
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      mode: session.mode
    });

  } catch (error) {
    console.error('❌ STRIPE - Error:', error.message);
    res.status(500).json({ 
      success: false,
      error: `Error: ${error.message}`
    });
  }
};
