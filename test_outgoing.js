const { WhatsAppBot } = require('@green-api/whatsapp-chatbot-js-v2');
require('dotenv').config();

console.log("Testing Outgoing Message...");
console.log("ID:", process.env.GREEN_API_INSTANCE_ID);
console.log("Token:", process.env.GREEN_API_API_TOKEN ? "Present" : "Missing");

const bot = new WhatsAppBot({
    idInstance: String(process.env.GREEN_API_INSTANCE_ID),
    apiTokenInstance: String(process.env.GREEN_API_API_TOKEN),
});

(async () => {
    try {
        // Send a message to your number (4796878016)
        const result = await bot.sendText("4796878016@c.us", "Deployment Test: The bot is trying to reach you!");
        console.log("✅ Success! Message sent:", result);
    } catch (e) {
        console.error("❌ Failed to send message:", e.message);
        if (e.response) {
            console.error("Data:", e.response.data);
        }
    }
})();
