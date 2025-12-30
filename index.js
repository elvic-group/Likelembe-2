const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const roscaManager = require('./services/roscaManager');
const whatsappService = require('./services/whatsappService');
const bot = require('./services/bot');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;

console.log("🚀 Server starting...");
console.log("Config Check:", {
    instanceId: !!process.env.GREEN_API_INSTANCE_ID,
    apiToken: !!process.env.GREEN_API_API_TOKEN,
    dbUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + "..." : "MISSING",
    stripe: !!process.env.STRIPE_SECRET_KEY,
    openai: !!process.env.OPENAI_API_KEY
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// --- STRIPE WEBHOOK (Must be before bodyParser.json) ---
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`Webhook Signature Verification Failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Retrieve metadata we stored when creating the link
        const phoneNumber = session.metadata.phoneNumber;
        
        console.log(`Payment successful for ${phoneNumber}`);
        
        if (phoneNumber) {
            const success = await roscaManager.markParticipantAsPaid(phoneNumber);
            if (success) {
                // Optional: Send confirmation via WhatsApp
                await whatsappService.sendMessage(phoneNumber, "Payment received! Thank you.");
            }
        }
    }

    res.status(200).send('Received');
});
// -------------------------------------------------------

app.use(bodyParser.json());

// Webhook endpoint for Green API
app.post('/webhook', async (req, res) => {
    try {
        console.log("📥 Incoming Webhook:", JSON.stringify(req.body, null, 2));
        // Delegate incoming Green API webhooks to the Chatbot SDK
        await bot.handleNotification({ body: req.body });
        res.status(200).send('OK');
    } catch (error) {
        console.error("❌ Webhook Error Stack:", error.stack);
        res.status(500).send('Error');
    }
});

// --- DASHBOARD ---
const path = require('path');
app.use(express.static('public')); // Serve static files like CSS/JS if needed later

// CRON JOB ENDPOINT
app.get('/api/cron/reminders', async (req, res) => {
    // Security check
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const result = await roscaManager.sendReminders();
        res.json({ success: true, message: result });
    } catch (e) {
        console.error(e);
        res.status(500).send('Error running cron');
    }
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/dashboard', async (req, res) => {
    try {
        const data = await roscaManager.getDashboardData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});
// -----------------

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        time: new Date(),
        config: {
            instanceId: !!process.env.GREEN_API_INSTANCE_ID,
            db: !!process.env.DATABASE_URL
        }
    });
});

app.get('/', (req, res) => {
    res.send('ROSCA WhatsApp Bot + AI is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Webhook URL: ${process.env.WEBHOOK_URL_BASE}/webhook`);
});
