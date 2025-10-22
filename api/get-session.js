const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    console.log('🔍 STRIPE - Obteniendo sesión:', session_id);

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['customer']
    });

    console.log('✅ STRIPE - Sesión obtenida:', session.id);
    console.log('✅ STRIPE - Customer ID:', session.customer?.id);

    res.status(200).json({ 
      success: true,
      customer: session.customer?.id,
      customerId: session.customer?.id,
      sessionStatus: session.status
    });

  } catch (error) {
    console.error('❌ STRIPE - Error obteniendo sesión:', error.message);
    res.status(500).json({ 
      success: false,
      error: `Error: ${error.message}`
    });
  }
};
