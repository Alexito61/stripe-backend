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

    // Intentamos crear la suscripción directamente
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    console.log('✅ STRIPE SUBSCRIPTION - Status:', subscription.status);

    // Si está activa, perfecto
    if (subscription.status === 'active') {
      return res.status(200).json({
        success: true,
        status: 'active',
        subscriptionId: subscription.id
      });
    }

    // Si necesita confirmación, creamos un checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || `https://yourwebsite.com/success?maintenance=added`,
      cancel_url: `https://yourwebsite.com/cancel`,
    });

    console.log('✅ STRIPE SUBSCRIPTION - Checkout creado:', session.url);

    res.status(200).json({
      success: true,
      status: 'requires_payment',
      checkoutUrl: session.url
    });

  } catch (error) {
    console.error('❌ STRIPE SUBSCRIPTION - Error:', error.message);
    
    // Fallback: crear un checkout session normal
    try {
      const { customerId, priceId, successUrl } = req.body;
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl || `https://yourwebsite.com/success?maintenance=added`,
        cancel_url: `https://yourwebsite.com/cancel`,
      });

      console.log('✅ STRIPE SUBSCRIPTION - Fallback checkout:', session.url);

      res.status(200).json({
        success: true,
        status: 'checkout_required',
        checkoutUrl: session.url
      });
    } catch (fallbackError) {
      res.status(500).json({ 
        success: false,
        error: `Subscription Error: ${fallbackError.message}`
      });
    }
  }
};
