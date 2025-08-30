const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Disable automatic body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// Function to parse raw request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  try {
    // Parse the raw request body
    const data = await parseBody(req);
    const { practitionerId, email, returnUrl } = data;

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

    // Return success response
    return res.status(200).json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
      message: 'Practitioner account created successfully'
    });

  } catch (error) {
    console.error('Error creating practitioner account:', error);
    return res.status(500).json({ 
      error: 'Failed to create practitioner account',
      details: error.message 
    });
  }
}
