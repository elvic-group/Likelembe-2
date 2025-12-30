require('dotenv').config();
const db = require('./services/db');

(async () => {
    try {
        console.log("🔍 Checking 5 most recent sessions...");
        const res = await db.query("SELECT * FROM bot_sessions ORDER BY updated_at DESC LIMIT 5");
        console.log("Found", res.rows.length, "sessions.");
        res.rows.forEach(row => {
            console.log("ChatId:", row.chat_id);
            // Redact sensitive data but show structure
            const data = row.data || {};
            console.log("State:", data.currentState);
            console.log("Data Keys:", Object.keys(data));
            console.log("Updated At:", row.updated_at);
            console.log("-------------------");
        });
        process.exit(0);
    } catch (e) {
        console.error("❌ Error:", e.message);
        process.exit(1);
    }
})();