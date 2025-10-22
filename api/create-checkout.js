const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { lineItems } = req.body;

    console.log('💰 STRIPE - Items a cobrar:', JSON.stringify(lineItems, null, 2));
    console.log('💰 STRIPE - Total de items:', lineItems.length);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems, // ← ENVIAR TODOS LOS ITEMS
      mode: 'payment',
      success_url: `https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://yourapp.com/cancel`,
    });

    console.log('✅ STRIPE - Sesión creada. Monto total:', session.amount_total);
    console.log('✅ STRIPE - URL:', session.url);

    res.status(200).json({ 
      success: true,
      checkoutUrl: session.url,
      amountTotal: session.amount_total
    });

  } catch (error) {
    console.error('❌ STRIPE - Error:', error.message);
    res.status(500).json({ 
      success: false,
      error: `Error: ${error.message}`
    });
  }
};
