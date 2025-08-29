const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { practitionerId, email, returnUrl } = req.body;

    // Validate required fields
    if (!practitionerId || !email || !returnUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields: practitionerId, email, returnUrl' 
      });
    }

    // Create Express account
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      email: email,
    });

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    // TODO: Update Airtable with account ID (we'll add this next)
    
    // Return success response
    res.status(200).json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
      message: 'Practitioner account created successfully'
    });

  } catch (error) {
    console.error('Error creating practitioner account:', error);
    res.status(500).json({ 
      error: 'Failed to create practitioner account',
      details: error.message 
    });
  }
}
