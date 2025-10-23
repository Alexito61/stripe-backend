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

    // 👇 DEBUGGING MEJORADO - Verificar EXACTAMENTE la clave
    console.log('🔍 STRIPE - Clave COMPLETA usada:', process.env.STRIPE_SECRET_KEY);
    console.log('🔍 STRIPE - Prefijo clave:', process.env.STRIPE_SECRET_KEY?.substring(0, 7));
    console.log('💰 STRIPE - Modo:', mode);
    console.log('💰 STRIPE - Cantidad de items:', lineItems.length);

    // 👇 LISTAR TODOS LOS PRICES DISPONIBLES primero
    console.log('🔍 STRIPE - Listando TODOS los prices disponibles...');
    try {
      const allPrices = await stripe.prices.list({ limit: 20, active: true });
      console.log('📋 Prices disponibles en LIVE:');
      allPrices.data.forEach(price => {
        console.log(`   - ${price.id} | ${price.nickname || 'No name'} | $${price.unit_amount / 100}`);
      });
    } catch (listError) {
      console.log('❌ Error listando prices:', listError.message);
    }

    // 👇 VERIFICAR CADA PRICE INDIVIDUALMENTE
    console.log('🔍 STRIPE - Verificando prices del request...');
    let totalAmount = 0;
    
    for (let i = 0; i < lineItems.length; i++) {
      const priceId = lineItems[i].price;
      try {
        const price = await stripe.prices.retrieve(priceId);
        const itemAmount = price.unit_amount / 100;
        const itemQuantity = lineItems[i].quantity || 1;
        const itemTotal = itemAmount * itemQuantity;
        totalAmount += itemTotal;
        
        console.log(`✅ Item ${i}: ${price.id} | ${price.nickname || 'No name'} | $${itemAmount} x ${itemQuantity} = $${itemTotal} ${price.currency}`);
      } catch (error) {
        console.log(`❌ Item ${i}: Price ${priceId} NO EXISTE - ${error.message}`);
        
        // Intentar buscar específicamente este price
        try {
          const searchPrice = await stripe.prices.search({
            query: `metadata['price_id']:'${priceId}'`,
          });
          console.log('🔍 Resultado búsqueda:', searchPrice.data.length ? 'ENCONTRADO' : 'NO ENCONTRADO');
        } catch (searchError) {
          console.log('❌ Error en búsqueda:', searchError.message);
        }
        
        return res.status(400).json({ 
          success: false,
          error: `Invalid price ID: ${priceId} - ${error.message}`
        });
      }
    }

    console.log(`💰 STRIPE - Total calculado: $${totalAmount}`);

    // Crear la sesión de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: mode,
      success_url: successUrl || `https://argentivaops.com/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://argentivaops.com/cancel`,
      customer_creation: 'always',
    });

    console.log('✅ STRIPE - Sesión creada:', session.id);
    
    res.status(200).json({ 
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('❌ STRIPE - Error general:', error.message);
    console.error('❌ STRIPE - Stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      error: `Error: ${error.message}`,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7)
    });
  }
};
