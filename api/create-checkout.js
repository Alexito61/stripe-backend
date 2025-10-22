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
    console.log('💰 STRIPE - Items recibidos:', JSON.stringify(lineItems, null, 2));

    // 👇 NUEVO DEBUGGING - Verificar TODOS los precios
    console.log('🔍 STRIPE - Verificando TODOS los precios...');
    for (let i = 0; i < lineItems.length; i++) {
      try {
        const price = await stripe.prices.retrieve(lineItems[i].price);
        console.log(`✅ Item ${i}: Price ${lineItems[i].price} - $${price.unit_amount / 100} ${price.currency}`);
      } catch (error) {
        console.log(`❌ Item ${i}: Price ${lineItems[i].price} NO EXISTE - ${error.message}`);
        return res.status(400).json({ 
          success: false,
          error: `Invalid price ID: ${lineItems[i].price} - ${error.message}`
        });
      }
    }

    // 👇 DEBUGGING - Verificar que el price base existe
    try {
      const priceCheck = await stripe.prices.retrieve(lineItems[0].price);
      console.log('✅ STRIPE - Price base existe:', priceCheck.id);
    } catch (priceError) {
      console.log('❌ STRIPE - Error con price base:', lineItems[0].price, priceError.message);
      return res.status(400).json({ 
        success: false,
        error: `Invalid price ID: ${lineItems[0].price} - ${errorError.message}`
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
    console.log('💰 STRIPE - Monto total:', session.amount_total);

    res.status(200).json({ 
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      mode: session.mode,
      customerId: session.customer,
      amountTotal: session.amount_total
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
