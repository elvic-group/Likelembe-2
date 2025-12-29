const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createPaymentLink(amount, name, phoneNumber) {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `ROSCA Contribution - ${name}`,
                        description: `Weekly contribution for ROSCA group. Participant: ${phoneNumber}`
                    },
                    unit_amount: amount * 100, // Amount in cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.WEBHOOK_URL_BASE}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.WEBHOOK_URL_BASE}/payment-cancel`,
            metadata: {
                phoneNumber: phoneNumber,
                type: 'rosca_contribution'
            }
        });

        return session.url;
    } catch (error) {
        console.error("Stripe Error:", error);
        return null;
    }
}

module.exports = { createPaymentLink };
