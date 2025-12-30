const whatsAppClient = require("@green-api/whatsapp-api-client");
require('dotenv').config();

const ID_INSTANCE = process.env.GREEN_API_ID_INSTANCE || process.env.GREEN_API_INSTANCE_ID;
const API_TOKEN = process.env.GREEN_API_API_TOKEN_INSTANCE || process.env.GREEN_API_API_TOKEN;
const WEBHOOK_URL = 'https://likelembe-2.vercel.app/webhook';

if (!ID_INSTANCE || !API_TOKEN) {
    console.error('❌ Error: Missing Green API credentials in .env');
    process.exit(1);
}

console.log(`🔌 Configuring Green API Webhook for Instance ${ID_INSTANCE}...`);

const restAPI = whatsAppClient.restAPI({
    idInstance: ID_INSTANCE,
    apiTokenInstance: API_TOKEN,
});

(async () => {
    try {
        const response = await restAPI.settings.setSettings({
            webhookUrl: WEBHOOK_URL,
            outgoingWebhook: 'yes',
            stateWebhook: 'yes',
            incomingWebhook: 'yes',
        });
        
        if (response && response.saveSettings) {
            console.log(`✅ Success! Webhook set to: ${WEBHOOK_URL}`);
        } else {
            console.log('⚠️  Warning: Unexpected response:', response);
        }
    } catch (error) {
        console.error('❌ Error setting webhook:', error);
    }
})();