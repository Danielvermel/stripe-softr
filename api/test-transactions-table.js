const Airtable = require("airtable");

export default async function handler(req, res) {
    try {
        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

        // Test Airtable connection
        const records = await base("Stripe - Practitioners").select({ maxRecords: 1 }).firstPage();

        res.json({
            success: true,
            message: "Airtable connection works",
            recordCount: records.length,
        });
    } catch (error) {
        res.status(500).json({
            error: "Test failed",
            details: error.message,
        });
    }
}
