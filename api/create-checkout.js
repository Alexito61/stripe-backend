const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lineItems } = req.body;

    // Si la key es temporal, simular respuesta
    if (process.env.STRIPE_SECRET_KEY === 'sk_test_temporal') {
      console.log('Modo simulación - Key temporal');
      return res.status(200).json({ 
        checkoutUrl: 'https://stripe.com/docs/testing#cards',
        message: 'Modo simulación - Conecta Stripe real para pagos'
      });
    }

    // Crear sesión de Checkout real
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    res.status(200).json({ 
      checkoutUrl: session.url 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Error creating checkout session' 
    });
  }
};
