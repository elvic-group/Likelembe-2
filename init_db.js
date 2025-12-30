const db = require('./services/db');

async function initDB() {
    try {
        console.log("Initializing database schema (PostgreSQL)...");
        
        // 1. Create Groups Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS groups (
                id SERIAL PRIMARY KEY,
                whatsapp_id VARCHAR(100) UNIQUE NOT NULL,
                name VARCHAR(100),
                default_currency VARCHAR(3) DEFAULT 'USD',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Create Default Group for legacy data
        await db.query(`
            INSERT INTO groups (whatsapp_id, name) 
            VALUES ('default', 'Default Circle') 
            ON CONFLICT (whatsapp_id) DO NOTHING;
        `);

        const defaultGroupRes = await db.query("SELECT id FROM groups WHERE whatsapp_id = 'default'");
        const defaultGroupId = defaultGroupRes.rows[0].id;

        // 3. Create Cycles Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS rosca_cycles (
                id SERIAL PRIMARY KEY,
                status VARCHAR(20) DEFAULT 'pending',
                current_recipient_index INTEGER DEFAULT 0,
                contribution_amount NUMERIC DEFAULT 100,
                pot_total NUMERIC DEFAULT 0,
                currency VARCHAR(3) DEFAULT 'USD',
                group_id INTEGER REFERENCES groups(id)
            );
        `);

        // 5. Backfill legacy cycles
        await db.query("UPDATE rosca_cycles SET group_id = $1 WHERE group_id IS NULL", [defaultGroupId]);

        await db.query(`
            CREATE TABLE IF NOT EXISTS participants (
                id SERIAL PRIMARY KEY,
                phone_number VARCHAR(20) NOT NULL,
                name VARCHAR(100),
                email VARCHAR(100),
                stripe_account_id VARCHAR(100),
                has_paid BOOLEAN DEFAULT FALSE,
                cycle_id INTEGER REFERENCES rosca_cycles(id),
                UNIQUE(phone_number, cycle_id)
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS bot_sessions (
                chat_id VARCHAR(255) PRIMARY KEY,
                data JSONB,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
