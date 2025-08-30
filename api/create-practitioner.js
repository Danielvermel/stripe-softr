// const Airtable = require('airtable');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// export default async function handler(req, res) {
//   // Debug environment variables
//   console.log('AIRTABLE_API_KEY exists:', !!process.env.AIRTABLE_API_KEY);
//   console.log('AIRTABLE_BASE_ID exists:', !!process.env.AIRTABLE_BASE_ID);
//   console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);

//   if (!process.env.AIRTABLE_API_KEY) {
//     return res.status(500).json({ error: 'AIRTABLE_API_KEY not found in environment' });
//   }

//   if (!process.env.AIRTABLE_BASE_ID) {
//     return res.status(500).json({ error: 'AIRTABLE_BASE_ID not found in environment' });
//   }

//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   try {
//     // Initialize Airtable (only once)
//     const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);

//     // Handle different body formats
//     let body;
//     if (typeof req.body === 'string') {
//       body = JSON.parse(req.body);
//     } else if (req.body) {
//       body = req.body;
//     } else {
//       return res.status(400).json({ error: 'No body received' });
//     }

//     const { practitionerId, email, returnUrl } = body;

//     if (!practitionerId || !email || !returnUrl) {
//       return res.status(400).json({
//         error: 'Missing fields: practitionerId, email, returnUrl'
//       });
//     }

//     // Create Stripe Express account
//     const account = await stripe.accounts.create({
//       type: 'express',
//       capabilities: {
//         card_payments: { requested: true },
//         transfers: { requested: true },
//       },
//       business_type: 'individual',
//       email: email,
//     });

//     // Create onboarding link
//     const accountLink = await stripe.accountLinks.create({
//       account: account.id,
//       refresh_url: returnUrl,
//       return_url: returnUrl,
//       type: 'account_onboarding',
//     });

//     // Update Airtable - USE EXACT TABLE NAME FROM YOUR AIRTABLE
//     await base('Stripe - Practitioners').update(practitionerId, {
//       'stripe_account_id': account.id,
//       'onboarding_completed': false,
//       'charges_enabled': false,
//       'payouts_enabled': false
//     });

//     res.json({
//       success: true,
//       accountId: account.id,
//       onboardingUrl: accountLink.url,
//       message: 'Practitioner account created and saved to Airtable!'
//     });

//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({
//       error: 'Failed to create practitioner account',
//       details: error.message
//     });
//   }
// }

const Airtable = require('airtable');

export default async function handler(req, res) {
  try {
    // Use your ACTUAL base ID directly (temporarily)
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base('appLSZSnT9kgWCxW1'); // Replace with your actual base ID
    
    const records = await base('tblNkUUlYzNxMZM9U')
      .select({ maxRecords: 1 })
      .firstPage();
    
    res.json({
      success: true,
      message: 'Direct base ID works!',
      recordCount: records.length
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Still failed',
      details: error.message
    });
  }
}


