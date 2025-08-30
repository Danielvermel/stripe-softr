const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Airtable = require("airtable");

export default async function handler(req, res) {
    try {
        const { practitionerId } = req.query;

        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
        const practitionerRecord = await base("tblNkUUlYzNxMZM9U").find(practitionerId);
        const stripeAccountId = practitionerRecord.get("stripe_account_id");

        // Get detailed account info
        const account = await stripe.accounts.retrieve(stripeAccountId);

        res.json({
            accountId: stripeAccountId,
            capabilities: account.capabilities,
            requirements: account.requirements,
            detailsSubmitted: account.details_submitted,
            payoutsEnabled: account.payouts_enabled,
            chargesEnabled: account.charges_enabled,
        });
    } catch (error) {
        res.json({ error: error.message });
    }
}
