const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { customerId, priceId, successUrl } = req.body;

    console.log('💰 STRIPE SUBSCRIPTION - Customer:', customerId);
    console.log('💰 STRIPE SUBSCRIPTION - Price:', priceId);
    console.log('💰 STRIPE SUBSCRIPTION - Success URL recibida:', successUrl);

    // Verificar que el price existe y es de suscripción
    try {
      const priceCheck = await stripe.prices.retrieve(priceId);
      console.log('✅ STRIPE SUBSCRIPTION - Price existe:', priceCheck.id, 'Tipo:', priceCheck.type);
      
      if (priceCheck.type !== 'recurring') {
        console.warn('⚠️ STRIPE SUBSCRIPTION - Price NO es recurrente:', priceCheck.type);
      }
    } catch (priceError) {
      console.log('❌ STRIPE SUBSCRIPTION - Error con price:', priceId, priceError.message);
      return res.status(400).json({ 
        success: false,
        error: `Invalid price ID: ${priceId}`
      });
    }

    // Para suscripciones, SIEMPRE crear checkout session (más confiable)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || `https://argentivaops.com/success?maintenance=added`,
      cancel_url: `https://argentivaops.com/sites-with-ai`,
      subscription_data: {
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
      },
    });

    console.log('✅ STRIPE SUBSCRIPTION - Checkout de suscripción creado:', session.url);
    console.log('✅ STRIPE SUBSCRIPTION - Session ID:', session.id);

    // 🔥 CORRECCIÓN PRINCIPAL: Siempre retornar checkoutUrl
    res.status(200).json({
      success: true,
      checkoutUrl: session.url,  // ← Frontend busca ESTE campo
      sessionId: session.id,
      mode: 'subscription'
    });

  } catch (error) {
    console.error('❌ STRIPE SUBSCRIPTION - Error:', error.message);
    console.error('❌ STRIPE SUBSCRIPTION - Stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      error: `Subscription Error: ${error.message}`
    });
  }
};
