const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createPaymentLink(amount, name, phoneNumber, currency = 'usd') {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: currency.toLowerCase(),
                    product_data: {
                        name: `ROSCA Contribution - ${name}`,
                        description: `Weekly contribution for ROSCA group. Participant: ${phoneNumber}`
                    },
                    unit_amount: Math.round(amount * 100), // Amount in cents
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

// --- STRIPE CONNECT (PAYOUTS) ---

async function createExpressAccount() {
    try {
        const account = await stripe.accounts.create({
            type: 'express',
        });
        return account.id;
    } catch (error) {
        console.error("Stripe Connect Error (Create Account):", error);
        return null;
    }
}

async function createAccountLink(accountId) {
    try {
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.WEBHOOK_URL_BASE}/connect-refresh`,
            return_url: `${process.env.WEBHOOK_URL_BASE}/connect-return`,
            type: 'account_onboarding',
        });
        return accountLink.url;
    } catch (error) {
        console.error("Stripe Connect Error (Link):", error);
        return null;
    }
}

async function transferFunds(destinationId, amount, currency = 'usd') {
    try {
        const transfer = await stripe.transfers.create({
            amount: Math.round(amount * 100),
            currency: currency.toLowerCase(),
            destination: destinationId,
        });
        return transfer;
    } catch (error) {
        console.error("Stripe Transfer Error:", error);
        throw error;
    }
}

module.exports = { 
    createPaymentLink, 
    createExpressAccount, 
    createAccountLink, 
    transferFunds 
};
