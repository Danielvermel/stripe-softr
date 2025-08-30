const Airtable = require("airtable");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        let body;
        if (typeof req.body === "string") {
            body = JSON.parse(req.body);
        } else if (req.body) {
            body = req.body;
        } else {
            return res.status(400).json({ error: "No body received" });
        }

        const { practitionerId, email, returnUrl } = body;

        if (!practitionerId || !email || !returnUrl) {
            return res.status(400).json({
                error: "Missing fields: practitionerId, email, returnUrl",
            });
        }

        // Create Stripe Express account
        const account = await stripe.accounts.create({
            type: "express",
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: "individual",
            email: email,
        });

        // Create onboarding link
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: returnUrl,
            return_url: returnUrl,
            type: "account_onboarding",
        });

        // Update Airtable with Stripe account ID AND onboarding link
        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

        await base("tblNkUUlYzNxMZM9U").update(practitionerId, {
            stripe_account_id: account.id,
            onboarding_url: accountLink.url, // 🆕 ADD THIS FIELD
            onboarding_completed: false,
            charges_enabled: false,
            payouts_enabled: false,
        });

        res.json({
            success: true,
            accountId: account.id,
            onboardingUrl: accountLink.url,
            message: "Practitioner account created and saved to Airtable!",
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            error: "Failed to create practitioner account",
            details: error.message,
        });
    }
}
