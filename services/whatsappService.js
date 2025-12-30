const whatsAppClient = require('@green-api/whatsapp-api-client');
require('dotenv').config();

const restAPI = whatsAppClient.restAPI({
    idInstance: String(process.env.GREEN_API_INSTANCE_ID),
    apiTokenInstance: String(process.env.GREEN_API_API_TOKEN)
});

async function sendMessage(phoneNumber, message) {
    try {
        const response = await restAPI.message.sendMessage(null, {
            chatId: `${phoneNumber}@c.us`,
            message: message
        });
        console.log(`Message sent to ${phoneNumber}:`, response);
        return response;
    } catch (error) {
        console.error(`Failed to send message to ${phoneNumber}:`, error);
        throw error;
    }
}

module.exports = {
    sendMessage,
    restAPI
};
