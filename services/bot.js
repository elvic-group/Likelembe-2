const { WhatsAppBot } = require('@green-api/whatsapp-chatbot-js-v2');
const roscaManager = require('./roscaManager');
const aiService = require('./aiService');
const PostgresStorage = require('./postgresStorage');
require('dotenv').config();

const bot = new WhatsAppBot({
    idInstance: process.env.GREEN_API_INSTANCE_ID,
    apiTokenInstance: process.env.GREEN_API_API_TOKEN,
    defaultState: 'menu',
    storage: new PostgresStorage()
});

// Helper to get phone from chatId (12345@c.us -> 12345)
const getPhone = (chatId) => chatId.split('@')[0];

// 1. Menu State
const menuState = {
    name: 'menu',
    async onEnter(message) {
        await bot.sendText(message.chatId, 
            "👋 Welcome to Likelembe! Your Money Rotation Circle.\n\n" +
            "Please select an option:\n" +
            "1️⃣ Join Circle\n" +
            "2️⃣ Pay Contribution\n" +
            "3️⃣ Status\n" +
            "4️⃣ Start Cycle (Admin)\n\n" +
            "Type a number or ask me anything!"
        );
    },
    async onMessage(message) {
        const text = message.text ? message.text.trim() : "";
        const phone = getPhone(message.chatId);
        
        if (text === '1' || text.toLowerCase().includes('join')) {
            return 'join_ask_name';
        }
        if (text === '2' || text.toLowerCase().includes('pay')) {
            return 'process_payment';
        }
        if (text === '3' || text.toLowerCase().includes('status')) {
            const status = await roscaManager.getStatus(phone);
            await bot.sendText(message.chatId, status);
            return null; // Stay in menu
        }
        if (text === '4' || text.toLowerCase().includes('start')) {
             const res = await roscaManager.startCircle(phone);
             await bot.sendText(message.chatId, res);
             return null;
        }

        // AI Fallback for non-commands
        try {
            const aiResponse = await aiService.getChatResponse(text);
            await bot.sendText(message.chatId, aiResponse);
        } catch (e) {
            console.error("AI Error:", e);
            await bot.sendText(message.chatId, "I'm having trouble thinking right now.");
        }
        return null; 
    }
};

// 2. Join Flow
const joinState = {
    name: 'join_ask_name',
    async onEnter(message) {
        await bot.sendText(message.chatId, "Great! What is your name?");
    },
    async onMessage(message) {
        const name = message.text.trim();
        const phone = getPhone(message.chatId);
        
        if (name.length < 2) {
            await bot.sendText(message.chatId, "That name is too short. Please try again.");
            return null; // Stay in this state
        }

        const res = await roscaManager.addParticipant(phone, name);
        await bot.sendText(message.chatId, res);
        
        // Return to menu after a short delay or immediately?
        // Immediate return is fine.
        return 'menu'; 
    }
};

// 3. Payment Flow
const payState = {
    name: 'process_payment',
    async onEnter(message) {
        const phone = getPhone(message.chatId);
        const name = message.senderName || "Member";
        
        await bot.sendText(message.chatId, "Generating your payment link...");
        
        const res = await roscaManager.initiatePayment(phone, name);
        await bot.sendText(message.chatId, res);
        
        return 'menu';
    }
};

bot.addState(menuState);
bot.addState(joinState);
bot.addState(payState);

module.exports = bot;
