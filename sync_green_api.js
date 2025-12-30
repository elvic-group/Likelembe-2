const whatsAppClient = require("@green-api/whatsapp-api-client");
require('dotenv').config();

// Unified names from .env
const ID_INSTANCE = process.env.GREEN_API_INSTANCE_ID;
const API_TOKEN = process.env.GREEN_API_API_TOKEN;
const WEBHOOK_URL = 'https://likelembe-2.vercel.app/webhook';

if (!ID_INSTANCE || !API_TOKEN) {
    console.error('❌ Error: Green API credentials (GREEN_API_INSTANCE_ID / GREEN_API_API_TOKEN) are missing in .env');
    process.exit(1);
}

const restAPI = whatsAppClient.restAPI({
    idInstance: ID_INSTANCE,
    apiTokenInstance: API_TOKEN,
});

async function sync() {
    try {
        console.log(`🔌 Step 1: Configuring Webhook for Instance ${ID_INSTANCE}...`);
        
        const setResponse = await restAPI.settings.setSettings({
            webhookUrl: WEBHOOK_URL,
            outgoingWebhook: 'yes',
            stateWebhook: 'yes',
            incomingWebhook: 'yes',
            incomingCallWebhook: 'yes'
        });

        if (setResponse && setResponse.saveSettings) {
            console.log('✅ Step 2: Webhook update requested successfully.');
            
            console.log('⏳ Step 3: Verifying settings (waiting 2 seconds)...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            const settings = await restAPI.settings.getSettings();
            console.log("-----------------------------------------");
            console.log("📊 Final Status:");
            console.log(`📡 URL: ${settings.webhookUrl}`);
            console.log(`📬 Incoming Messages: ${settings.incomingWebhook}`);
            console.log("-----------------------------------------");

            if (settings.webhookUrl === WEBHOOK_URL) {
                console.log("🏆 SUCCESS! Your bot is now connected to WhatsApp.");
            } else {
                console.log("⚠️  Verification failed. The URL in Green API is: " + settings.webhookUrl);
            }
        } else {
            console.log('❌ Error: Green API did not confirm the settings change.');
        }
    } catch (error) {
        console.error('❌ Critical Error:', error.message || error);
    }
}

sync();