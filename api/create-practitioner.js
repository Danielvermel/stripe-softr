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

        const { practitionerId, email, returnUrl, name } = body; // ✅ ADD NAME HERE

        if (!practitionerId || !email || !returnUrl) {
            return res.status(400).json({
                error: "Missing fields: practitionerId, email, returnUrl",
            });
        }

        console.log("💳 Creating Stripe account for:", name || email);

        // ✅ USE NAME IN STRIPE ACCOUNT CREATION
        const account = await stripe.accounts.create({
            type: "express",
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: "individual",
            email: email,
            business_profile: {
                name: name || "HealGuid Practitioner", // ✅ ADD NAME TO BUSINESS PROFILE
            },
        });

        console.log("🔗 Creating onboarding link...");
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: returnUrl,
            return_url: returnUrl,
            type: "account_onboarding",
        });

        console.log("📝 Creating record in Stripe Accounts table...");
        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

        const createdRecord = await base("tblNkUUlYzNxMZM9U").create([
            {
                fields: {
                    practitioner_id: [practitionerId],
                    email: email,
                    practitioner_name: name, // ✅ SAVE NAME TO AIRTABLE
                    stripe_account_id: account.id,
                    onboarding_url: accountLink.url,
                    onboarding_status: "Link Sent",
                    onboarding_completed: false,
                    charges_enabled: false,
                    payouts_enabled: false,
                },
            },
        ]);

        console.log("✅ Record created successfully");

        res.json({
            success: true,
            accountId: account.id,
            onboardingUrl: accountLink.url,
            stripeRecordId: createdRecord[0].id,
            message: "Practitioner account created and saved to Stripe Accounts table!",
        });
    } catch (error) {
        console.error("💥 ERROR:", error);
        res.status(500).json({
            error: "Failed to create practitioner account",
            details: error.message,
        });
    }
}
