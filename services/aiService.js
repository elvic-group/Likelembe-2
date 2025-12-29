const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI only if key is present
let openai = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

async function getChatResponse(userMessage) {
    if (!openai) {
        return "AI capabilities are not enabled (OPENAI_API_KEY missing).";
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant for a ROSCA (Money Rotation) WhatsApp group. Answer questions about money saving, ROSCA rules, or general queries." },
                { role: "user", content: userMessage }
            ],
            model: "gpt-3.5-turbo",
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI Error:", error);
        return "Sorry, I'm having trouble thinking right now.";
    }
}

module.exports = { getChatResponse };
