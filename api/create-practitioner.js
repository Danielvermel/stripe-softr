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

        // ✅ DEBUG: Check existing field names first
        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
        
        try {
            const existingRecord = await base("Stripe - Practitioners").find(practitionerId);
            console.log("Available field names:", Object.keys(existingRecord.fields));
            
            // Return the field names for debugging
            return res.json({
                debug: true,
                availableFields: Object.keys(existingRecord.fields),
                message: "Field names discovered - check console and update your code"
            });
            
        } catch (debugError) {
            console.error("Debug error:", debugError);
            return res.status(500).json({
                error: "Debug failed",
                details: debugError.message
            });
        }

        // ... rest of your Stripe code (commented out for debugging)
        
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            error: "Failed to create practitioner account",
            details: error.message,
        });
    }
}
