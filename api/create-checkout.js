const Airtable = require('airtable');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body;
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else if (req.body) {
      body = req.body;
    } else {
      return res.status(400).json({ error: 'No body received' });
    }

    const { 
      practitionerId, 
      patientEmail, 
      consultationPrice, 
      platformCommission, 
      consultationDetails,
      returnUrl 
    } = body;

    // Validation
    if (!practitionerId || !patientEmail || !consultationPrice || !platformCommission || !returnUrl) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Initialize Airtable
    const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);

    // Get practitioner's Stripe account ID
    const practitionerRecord = await base('tblNkUUlYzNxMZM9U').find(practitionerId);
    const stripeAccountId = practitionerRecord.get('stripe_account_id');

    if (!stripeAccountId) {
      return res.status(400).json({
        error: 'Practitioner has not created Stripe account yet'
      });
    }

    // Calculate amounts
    const practitionerAmount = consultationPrice - platformCommission;

    // Create Stripe Checkout Session with correct Connect syntax
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: consultationDetails || 'Health Consultation',
            description: `Consultation with practitioner`
          },
          unit_amount: consultationPrice,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      customer_email: patientEmail,
      payment_intent_data: {
        application_fee_amount: platformCommission,
        transfer_data: {
          destination: stripeAccountId,
        },
      },
    });

    // Create transaction record in Airtable
    const transactionRecord = await base('tblKAIATQsZvoLOzN').create([{
      fields: {
        patient_email: patientEmail,
        practitioner_id: [practitionerId],
        consultation_price: consultationPrice / 100,
        platform_commission: platformCommission / 100,
        practitioner_amount: practitionerAmount / 100,
        stripe_session_id: session.id,
        payment_status: 'Pending',
        consultation_details: consultationDetails || 'Health consultation',
      }
    }]);

    res.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      transactionId: transactionRecord[0].id,
      amounts: {
        total: consultationPrice / 100,
        platformCommission: platformCommission / 100,
        practitionerAmount: practitionerAmount / 100
      },
      message: 'Checkout session with payment splitting created successfully!'
    });

  } catch (error) {
    console.error('Error creating checkout:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
}
