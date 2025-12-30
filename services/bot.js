const { WhatsAppBot } = require('@green-api/whatsapp-chatbot-js-v2');
const roscaManager = require('./roscaManager');
const aiService = require('./aiService');
const emailService = require('./emailService');
const PostgresStorage = require('./postgresStorage');
const db = require('./db');
require('dotenv').config();

if (!process.env.GREEN_API_INSTANCE_ID || !process.env.GREEN_API_API_TOKEN) {
    throw new Error('Missing required Green API environment variables: GREEN_API_INSTANCE_ID and GREEN_API_API_TOKEN');
}

const bot = new WhatsAppBot({
    idInstance: String(process.env.GREEN_API_INSTANCE_ID),
    apiTokenInstance: String(process.env.GREEN_API_API_TOKEN),
    defaultState: 'menu',
    storage: new PostgresStorage()
});

// Helpers
const getPhone = (chatId) => chatId.split('@')[0];

const handleEscapeHatch = async (message) => {
    const text = message.text ? message.text.trim().toLowerCase() : "";
    if (text === 'menu' || text === 'cancel' || text === '/reset' || text === '/menu' || text === 'exit') {
        console.log(`[BOT] Resetting session for ${message.chatId}`);
        await bot.storage.clearSession(message.chatId);
        return true;
    }
    return false;
};

// 1. Menu State
const menuState = {
    name: 'menu',
    async onEnter(message) {
        console.log(`[BOT] Menu Enter: ${message.chatId}`);
        await bot.sendText(message.chatId, 
            "👋 *Welcome to Likelembe!* 🌍\n" +
            "_Your Trusted Money Rotation Circle_\n\n" +
            "Please select an action:\n" +
            "1️⃣ *Join a Circle* (Join the savings pool)\n" +
            "2️⃣ *Pay Contribution* (Make your weekly payment)\n" +
            "3️⃣ *My Status* (Check your payments & pot)\n" +
            "4️⃣ *Start Cycle* (Admin Only)\n" +
            "5️⃣ *Create New Circle* (Start a new group)\n" +
            "6️⃣ *Setup Payouts* (Link your bank account)\n" +
            "7️⃣ *Trigger Payout* (Admin: Send money to winner)\n\n" +
            "_Type a number or ask me anything!_\n\n" +
            "💡 _Type *menu* anytime to reset._"
        );
    },
    async onMessage(message) {
        console.log(`[BOT] Menu Message: ${message.chatId} - \"${message.text}\"`);
        if (await handleEscapeHatch(message)) return 'menu';

        const text = message.text ? message.text.trim() : "";
        const phone = getPhone(message.chatId);
        
        if (text === '1' || text.toLowerCase().includes('join')) {
            return 'join_ask_name';
        }
        if (text === '2' || text.toLowerCase().includes('pay')) {
            return 'process_payment';
        }
        if (text === '3' || text.toLowerCase().includes('status')) {
            const status = await roscaManager.getStatus(phone, message.chatId);
            await bot.sendText(message.chatId, status);
            return null;
        }
        if (text === '4' || text.toLowerCase().includes('start')) {
             const res = await roscaManager.startCircle(phone, message.chatId);
             await bot.sendText(message.chatId, res);
             return null;
        }
        if (text === '5' || text.toLowerCase().includes('create')) {
            return 'create_circle_ask_name';
        }
        if (text === '6' || text.toLowerCase().includes('setup')) {
            const res = await roscaManager.setupPayout(phone, message.chatId);
            await bot.sendText(message.chatId, res);
            return null;
        }
        if (text === '7' || text.toLowerCase().includes('payout')) {
            const res = await roscaManager.payoutWinner(message.chatId);
            await bot.sendText(message.chatId, res);
            return null;
        }

        // AI Fallback
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
    async onMessage(message, data = {}) {
        if (await handleEscapeHatch(message)) return 'menu';
        const name = message.text ? message.text.trim() : "";
        
        if (name.length < 2) {
            await bot.sendText(message.chatId, "⚠️ That name is too short. Please try again.");
            return null; 
        }

        await bot.sendText(message.chatId, `Nice to meet you, *${name}*! 👋\nWhat is your email address? (We will send a verification code)`);
        
        return {
            state: 'join_ask_email',
            data: { ...data, name: name } 
        };
    }
};

const joinEmailState = {
    name: 'join_ask_email',
    async onMessage(message, data) {
        if (await handleEscapeHatch(message)) return 'menu';
        const email = message.text ? message.text.trim() : "";

        if (!email.includes('@')) {
            await bot.sendText(message.chatId, "⚠️ Please enter a valid email address.");
            return null;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        try {
            await emailService.sendOTP(email, otp);
            await bot.sendText(message.chatId, `🔐 I've sent a 6-digit code to *${email}*.\nPlease check your inbox (and spam) and enter the code here:`);
            
            return {
                state: 'join_verify_otp',
                data: { ...data, email: email, otp: otp }
            };
        } catch (e) {
            console.error("OTP Email Error:", e);
            await bot.sendText(message.chatId, "❌ Failed to send email. Please try again.");
            return null;
        }
    }
};

const joinVerifyState = {
    name: 'join_verify_otp',
    async onMessage(message, data) {
        if (await handleEscapeHatch(message)) return 'menu';
        const input = message.text ? message.text.trim() : "";
        const phone = getPhone(message.chatId);
        
        if (input === data.otp) {
            const res = await roscaManager.addParticipant(phone, data.name, data.email, message.chatId);
            await bot.sendText(message.chatId, res);
            return 'menu';
        } else {
            await bot.sendText(message.chatId, "❌ Incorrect code. Please check your email or type *menu* to start over.");
            return null; 
        }
    }
};

// 3. Payment Flow
const payState = {
    name: 'process_payment',
    async onEnter(message) {
        const phone = getPhone(message.chatId);
        const name = message.senderName || "Member";
        await bot.sendText(message.chatId, "💸 Generating your secure payment link...");
        const res = await roscaManager.initiatePayment(phone, name, message.chatId);
        await bot.sendText(message.chatId, res);
        return 'menu';
    },
    async onMessage(message) {
        return 'menu';
    }
};

// 4. Create Group Flow
const createGroupState = {
    name: 'create_circle_ask_name',
    async onEnter(message) {
        await bot.sendText(message.chatId, "📝 What should we name the new circle? (e.g., Family Savings)");
    },
    async onMessage(message, data = {}) {
        if (await handleEscapeHatch(message)) return 'menu';
        const groupName = message.text ? message.text.trim() : "";
        if (groupName.length < 3) {
            await bot.sendText(message.chatId, "⚠️ Name too short. Try again.");
            return null;
        }
        await bot.sendText(message.chatId, "💱 Which currency should we use? (USD, EUR, GBP, CAD)");
        return {
            state: 'create_circle_ask_currency',
            data: { ...data, name: groupName }
        };
    }
};

const createCurrencyState = {
    name: 'create_circle_ask_currency',
    async onMessage(message, data) {
        if (await handleEscapeHatch(message)) return 'menu';
        const currency = message.text ? message.text.trim().toUpperCase() : "";
        const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD'];
        
        if (!validCurrencies.includes(currency)) {
            await bot.sendText(message.chatId, "⚠️ Invalid currency. Please choose USD, EUR, GBP, or CAD.");
            return null;
        }

        try {
            await bot.sendText(message.chatId, `🔨 Creating "*${data.name}*" (${currency})...`);
            const result = await bot.api.group.createGroup(data.name, [message.chatId]);
            
            if (result && result.created) {
                await roscaManager.registerGroup(result.chatId, data.name, currency);
                await bot.sendText(message.chatId, `✅ *Circle Created!*

🔗 *Invite Link:* ${result.groupInviteLink}`);
            } else {
                await bot.sendText(message.chatId, "❌ Failed to create group.");
            }
        } catch (e) {
            console.error("Create Group Error:", e);
            await bot.sendText(message.chatId, "❌ Error creating group.");
        }
        return 'menu';
    }
};

bot.addState(menuState);
bot.addState(joinState);
bot.addState(joinEmailState);
bot.addState(joinVerifyState);
bot.addState(payState);
bot.addState(createGroupState);
bot.addState(createCurrencyState);

module.exports = bot;
