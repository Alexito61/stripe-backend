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
    console.log('💰 STRIPE - Cantidad de items:', lineItems.length);
    console.log('💰 STRIPE - Items recibidos:', JSON.stringify(lineItems, null, 2));

    // 👇 DEBUGGING - Verificar TODOS los precios
    console.log('🔍 STRIPE - Verificando TODOS los precios...');
    let totalAmount = 0;
    
    for (let i = 0; i < lineItems.length; i++) {
      try {
        const price = await stripe.prices.retrieve(lineItems[i].price);
        const itemAmount = price.unit_amount / 100;
        const itemQuantity = lineItems[i].quantity || 1;
        const itemTotal = itemAmount * itemQuantity;
        totalAmount += itemTotal;
        
        console.log(`✅ Item ${i}: ${price.nickname || 'No name'} - $${itemAmount} x ${itemQuantity} = $${itemTotal} ${price.currency}`);
      } catch (error) {
        console.log(`❌ Item ${i}: Price ${lineItems[i].price} NO EXISTE - ${error.message}`);
        return res.status(400).json({ 
          success: false,
          error: `Invalid price ID: ${lineItems[i].price} - ${error.message}`
        });
      }
    }

    console.log(`💰 STRIPE - Total calculado: $${totalAmount}`);

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
    console.log('💰 STRIPE - Monto total en session:', session.amount_total);
    console.log('💰 STRIPE - Moneda:', session.currency);

    // Verificar que el monto coincida
    const sessionAmount = session.amount_total / 100;
    if (sessionAmount !== totalAmount) {
      console.warn(`⚠️  ADVERTENCIA: Monto no coincide - Frontend: $${totalAmount} vs Stripe: $${sessionAmount}`);
    }

    res.status(200).json({ 
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      mode: session.mode,
      customerId: session.customer,
      amountTotal: session.amount_total,
      currency: session.currency
    });

  } catch (error) {
    console.error('❌ STRIPE - Error:', error.message);
    console.error('❌ STRIPE - Stack:', error.stack);
    
    // Debug adicional para errores de Stripe
    if (error.type === 'StripeInvalidRequestError') {
      console.error('❌ STRIPE - Error de request inválida:', error.raw?.message);
    }
    
    res.status(500).json({ 
      success: false,
      error: `Error: ${error.message}`,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
      errorType: error.type
    });
  }
};
