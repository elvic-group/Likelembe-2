const db = require('./services/db');

async function initDB() {
    try {
        console.log("Initializing database schema (SQLite/LibSQL)...");
        
        // 1. Create Groups Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                whatsapp_id TEXT UNIQUE NOT NULL,
                name TEXT,
                default_currency TEXT DEFAULT 'USD',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Create Default Group for legacy data
        // SQLite syntax: INSERT OR IGNORE or ON CONFLICT(whatsapp_id) DO NOTHING
        await db.query(`
            INSERT INTO groups (whatsapp_id, name) 
            VALUES ('default', 'Default Circle') 
            ON CONFLICT(whatsapp_id) DO NOTHING;
        `);

        const defaultGroupRes = await db.query("SELECT id FROM groups WHERE whatsapp_id = 'default'");
        const defaultGroupId = defaultGroupRes.rows[0].id;

        // 3. Create Cycles Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS rosca_cycles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                status TEXT DEFAULT 'pending',
                current_recipient_index INTEGER DEFAULT 0,
                contribution_amount NUMERIC DEFAULT 100,
                pot_total NUMERIC DEFAULT 0,
                currency TEXT DEFAULT 'USD',
                group_id INTEGER REFERENCES groups(id)
            );
        `);

        // Note: SQLite supports ADD COLUMN but it's simpler to just ensure the table 
        // has the columns if we are starting fresh or if we do conditional checks.
        // For migration safety, we can try adding columns and catch errors.

        // 5. Backfill legacy cycles (if any exist without group_id - unlikely in fresh SQLite but good for logic)
        try {
            await db.query("UPDATE rosca_cycles SET group_id = ? WHERE group_id IS NULL", [defaultGroupId]);
        } catch(e) {}

        await db.query(`
            CREATE TABLE IF NOT EXISTS participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT NOT NULL,
                name TEXT,
                email TEXT,
                stripe_account_id TEXT,
                has_paid BOOLEAN DEFAULT 0,
                cycle_id INTEGER REFERENCES rosca_cycles(id),
                UNIQUE(phone_number, cycle_id)
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS bot_sessions (
                chat_id TEXT PRIMARY KEY,
                data TEXT,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log("Database schema initialized.");
        process.exit(0);
    } catch (err) {
        console.error("Error initializing DB:", err);
        process.exit(1);
    }
}

initDB();