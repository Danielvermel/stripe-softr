const Airtable = require("airtable");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    console.log("🚀 API Handler Started");
    console.log("📝 Request method:", req.method);
    console.log("📝 Request body type:", typeof req.body);
    console.log("📝 Request body content:", req.body);

    if (req.method !== "POST") {
        console.error("❌ Invalid method:", req.method);
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        let body;
        if (typeof req.body === "string") {
            console.log("📝 Parsing JSON string body");
            body = JSON.parse(req.body);
        } else if (req.body) {
            console.log("📝 Using body object directly");
            body = req.body;
        } else {
            console.error("❌ No body received");
            return res.status(400).json({ error: "No body received" });
        }

        const { practitionerId, email, returnUrl } = body;
        console.log("📝 Extracted values:", { practitionerId, email, returnUrl });

        if (!practitionerId || !email || !returnUrl) {
            console.error("❌ Missing required fields:", {
                practitionerId: !!practitionerId,
                email: !!email,
                returnUrl: !!returnUrl,
            });
            return res.status(400).json({ error: "Missing fields: practitionerId, email, returnUrl" });
        }

        console.log("🎯 All required fields present");

        // Step 1: Check if we can connect to Airtable and find the record
        console.log("🔍 Connecting to Airtable...");
        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
        console.log("✅ Airtable base connected");

        try {
            console.log("🔍 Looking up existing record:", practitionerId);
            const existingRecord = await base("tblNkUUlYzNxMZM9U").find(practitionerId);
            console.log("✅ Record found successfully");
            console.log("📝 Current field names in record:", Object.keys(existingRecord.fields));
            console.log("📝 Current field count:", Object.keys(existingRecord.fields).length);

            // Check if stripe fields exist
            const hasStripeAccountId = existingRecord.fields.hasOwnProperty("stripe_account_id");
            const hasOnboardingUrl = existingRecord.fields.hasOwnProperty("onboarding_url");
            const hasOnboardingStatus = existingRecord.fields.hasOwnProperty("onboarding_status");

            console.log("🔍 Stripe field checks:");
            console.log("  - stripe_account_id exists:", hasStripeAccountId);
            console.log("  - onboarding_url exists:", hasOnboardingUrl);
            console.log("  - onboarding_status exists:", hasOnboardingStatus);
        } catch (recordError) {
            console.error("❌ Error finding record:", recordError.message);
            return res.status(404).json({
                error: "Record not found",
                details: recordError.message,
                practitionerId: practitionerId,
            });
        }

        console.log("💳 Creating Stripe Express account...");
        const account = await stripe.accounts.create({
            type: "express",
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: "individual",
            email: email,
        });
        console.log("✅ Stripe account created:", account.id);

        console.log("🔗 Creating account onboarding link...");
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: returnUrl,
            return_url: returnUrl,
            type: "account_onboarding",
        });
        console.log("✅ Onboarding link created:", accountLink.url);

        // Step 2: Try to update the record
        console.log("🔄 Attempting to update Airtable record...");
        console.log("📝 Table ID:", "tblNkUUlYzNxMZM9U");
        console.log("📝 Record ID:", practitionerId);
        console.log("📝 Update data:", {
            stripe_account_id: account.id,
            onboarding_url: accountLink.url,
            onboarding_status: "Link Sent",
            onboarding_completed: false,
            charges_enabled: false,
            payouts_enabled: false,
        });

        await base("tblNkUUlYzNxMZM9U").update(practitionerId, {
            stripe_account_id: account.id,
            onboarding_url: accountLink.url,
            onboarding_status: "Link Sent",
            onboarding_completed: false,
            charges_enabled: false,
            payouts_enabled: false,
        });

        console.log("✅ Airtable record updated successfully");

        const response = {
            success: true,
            accountId: account.id,
            onboardingUrl: accountLink.url,
            message: "Practitioner account created and saved to Airtable!",
        };

        console.log("🎉 API completed successfully:", response);
        res.json(response);
    } catch (error) {
        console.error("💥 MAIN ERROR CAUGHT:");
        console.error("   Error type:", error.constructor.name);
        console.error("   Error message:", error.message);
        console.error("   Error code:", error.statusCode || "N/A");
        console.error("   Full error object:", error);

        if (error.stack) {
            console.error("   Stack trace:", error.stack);
        }

        res.status(500).json({
            error: "Failed to create practitioner account",
            details: error.message,
            errorType: error.constructor.name,
            statusCode: error.statusCode || 500,
        });
    }
}
