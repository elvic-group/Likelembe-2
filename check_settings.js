const whatsAppClient = require("@green-api/whatsapp-api-client");
require('dotenv').config();

const ID_INSTANCE = process.env.GREEN_API_ID_INSTANCE || process.env.GREEN_API_INSTANCE_ID;
const API_TOKEN = process.env.GREEN_API_API_TOKEN_INSTANCE || process.env.GREEN_API_API_TOKEN;

const restAPI = whatsAppClient.restAPI({
    idInstance: ID_INSTANCE,
    apiTokenInstance: API_TOKEN,
});

(async () => {
    try {
        const settings = await restAPI.settings.getSettings();
        console.log("-----------------------------------------");
        console.log("🛠️  Current Green API Instance Settings:");
        console.log(`📡 Webhook URL: ${settings.webhookUrl || 'Not Set'}`);
        console.log(`✅ Incoming Messages: ${settings.incomingWebhook}`);
        console.log(`🔁 Outgoing Messages: ${settings.outgoingWebhook}`);
        console.log("-----------------------------------------");
        
        if (settings.webhookUrl === 'https://likelembe-2.vercel.app/webhook') {
            console.log("🏆 Everything is correctly configured!");
        } else {
            console.log("⚠️  Webhook URL mismatch. Please run 'node setup_webhook.js' again.");
        }
    } catch (error) {
        console.error('❌ Error fetching settings:', error);
    }
})();
