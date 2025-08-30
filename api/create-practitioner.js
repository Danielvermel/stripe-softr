const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  try {
    console.log('Request body:', req.body);
    console.log('Request body type:', typeof req.body);

    // In Vercel serverless functions, req.body is automatically parsed
    const { practitionerId, email, returnUrl } = req.body;

    if (!practitionerId || !email || !returnUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: req.body
      });
    }

    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      email: email,
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    res.status(200).json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
      message: 'Practitioner account created successfully'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to create practitioner account',
      details: error.message 
    });
  }
}
