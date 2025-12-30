const db = require('./db');

class PostgresStorage {
    constructor() {
        this.tableChecked = false;
    }

    async ensureTable() {
        if (this.tableChecked) return;
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS bot_sessions (
                    chat_id VARCHAR(255) PRIMARY KEY,
                    data JSONB,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            this.tableChecked = true;
        } catch (e) {
            console.error("Failed to ensure table:", e);
        }
    }

    async get(chatId) {
        console.log(`[STORAGE] Getting session for ${chatId}`);
        await this.ensureTable();
        try {
            const res = await db.query('SELECT data FROM bot_sessions WHERE chat_id = $1', [chatId]);
            if (res.rows.length > 0) {
                console.log(`[STORAGE] Found session for ${chatId}`);
                return res.rows[0].data;
            }
            console.log(`[STORAGE] No session found for ${chatId}`);
            return null;
        } catch (e) {
            console.error("[STORAGE] GET error:", e.message);
            return null;
        }
    }

    async set(chatId, data) {
        if (!chatId) return;
        console.log(`[STORAGE] Saving session for ${chatId}`);
        await this.ensureTable();
        try {
            await db.query(`
                INSERT INTO bot_sessions (chat_id, data, updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (chat_id) 
                DO UPDATE SET data = $2, updated_at = NOW()
            `, [chatId, data]);
            console.log(`[STORAGE] Saved session for ${chatId}`);
        } catch (e) {
            console.error("[STORAGE] SET error:", e.message);
        }
    }
}

module.exports = PostgresStorage;
