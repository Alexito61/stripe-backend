const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { lineItems, mode = 'payment', successUrl } = req.body;

    // 👇 DEBUGGING - Verificar la clave de Stripe
    console.log('🔍 STRIPE - Clave usada:', process.env.STRIPE_SECRET_KEY?.substring(0, 20) + '...');
    console.log('💰 STRIPE - Modo:', mode);
    console.log('💰 STRIPE - Items:', JSON.stringify(lineItems, null, 2));

    // 👇 DEBUGGING - Verificar que el price existe
    try {
      const priceCheck = await stripe.prices.retrieve(lineItems[0].price);
      console.log('✅ STRIPE - Price existe:', priceCheck.id);
    } catch (priceError) {
      console.log('❌ STRIPE - Error con price:', lineItems[0].price, priceError.message);
      return res.status(400).json({ 
        success: false,
        error: `Invalid price ID: ${lineItems[0].price} - ${priceError.message}`
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: mode,
      success_url: successUrl || `https://yourwebsite.com/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://yourwebsite.com/cancel`,
      customer_creation: 'always',
    });

    console.log('✅ STRIPE - Sesión creada:', session.id);
    console.log('✅ STRIPE - Customer:', session.customer);

    res.status(200).json({ 
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      mode: session.mode,
      customerId: session.customer
    });

  } catch (error) {
    console.error('❌ STRIPE - Error:', error.message);
    console.error('❌ STRIPE - Stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: `Error: ${error.message}`,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7)
    });
  }
};
