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
    console.log('💰 STRIPE SUBSCRIPTION - Success URL:', successUrl);

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

    // Intentamos crear la suscripción directamente
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    console.log('✅ STRIPE SUBSCRIPTION - Status:', subscription.status);

    // Si está activa, perfecto - RETORNO QUE ESPERA EL FRONTEND
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      return res.status(200).json({
        success: true,
        status: subscription.status, // 'active' o 'trialing'
        subscriptionId: subscription.id
      });
    }

    // Si necesita confirmación, creamos un checkout - RETORNO CORREGIDO
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || `https://argentivaops.com/success?maintenance=added`,
      cancel_url: `https://argentivaops.com/sites-with-ai`,
    });

    console.log('✅ STRIPE SUBSCRIPTION - Checkout creado:', session.url);

    // 🔥 CORRECCIÓN: Retornar SOLO checkoutUrl (sin status extra)
    res.status(200).json({
      success: true,
      checkoutUrl: session.url  // ← El frontend busca ESTE campo
    });

  } catch (error) {
    console.error('❌ STRIPE SUBSCRIPTION - Error:', error.message);
    
    // Fallback: crear un checkout session normal - CORREGIDO
    try {
      const { customerId, priceId, successUrl } = req.body;
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl || `https://argentivaops.com/success?maintenance=added`,
        cancel_url: `https://argentivaops.com/sites-with-ai`,
      });

      console.log('✅ STRIPE SUBSCRIPTION - Fallback checkout:', session.url);

      // 🔥 CORRECCIÓN: Retornar SOLO checkoutUrl
      res.status(200).json({
        success: true,
        checkoutUrl: session.url  // ← El frontend busca ESTE campo
      });
    } catch (fallbackError) {
      res.status(500).json({ 
        success: false,
        error: `Subscription Error: ${fallbackError.message}`
      });
    }
  }
};
