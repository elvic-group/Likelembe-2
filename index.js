const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const roscaManager = require('./services/roscaManager');
const whatsappService = require('./services/whatsappService');
const aiService = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Webhook endpoint for Green API
app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;
        if (!body || !body.typeWebhook) {
            return res.status(200).send('OK');
        }

        // Only handle incoming text messages
        if (body.typeWebhook === 'incomingMessageReceived' && 
            body.messageData && 
            body.messageData.textMessageData) {
            
            const senderData = body.senderData;
            const messageData = body.messageData.textMessageData;
            const sender = senderData.sender;
            const phoneNumber = sender.split('@')[0];
            const text = messageData.textMessage.trim();
            const senderName = senderData.senderName || 'Friend';

            console.log(`Received from ${phoneNumber}: ${text}`);

            // 1. Try ROSCA Command
            const roscaResponse = await roscaManager.processCommand(phoneNumber, text, senderName);
            
            if (roscaResponse) {
                // It was a ROSCA command
                await whatsappService.sendMessage(phoneNumber, roscaResponse);
            } else {
                // 2. Fallback to AI
                const aiResponse = await aiService.getChatResponse(text);
                await whatsappService.sendMessage(phoneNumber, aiResponse);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Error');
    }
});

app.get('/', (req, res) => {
    res.send('ROSCA WhatsApp Bot + AI is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Webhook URL: ${process.env.WEBHOOK_URL_BASE}/webhook`);
});
