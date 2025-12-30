const db = require('./services/db');
require('dotenv').config();

(async () => {
    try {
        console.log("Checking sessions...");
        const res = await db.query("SELECT * FROM bot_sessions");
        console.log("Found", res.rows.length, "sessions.");
        res.rows.forEach(row => {
            console.log("ChatId:", row.chat_id);
            console.log("Data:", JSON.stringify(row.data, null, 2));
            console.log("Updated At:", row.updated_at);
            console.log("-------------------");
        });
        process.exit(0);
    } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
    }
})();
