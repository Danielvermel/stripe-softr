const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "gbp",
                        product_data: { name: "Test Consultation" },
                        unit_amount: 15000,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: "https://google.com",
            cancel_url: "https://google.com",
        });

        res.json({ success: true, checkoutUrl: session.url });
    } catch (error) {
        res.json({ error: error.message });
    }
}
