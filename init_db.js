const db = require('./services/db');

async function initDB() {
    try {
        console.log("Initializing database schema...");
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS rosca_cycles (
                id SERIAL PRIMARY KEY,
                status VARCHAR(20) DEFAULT 'pending',
                current_recipient_index INTEGER DEFAULT 0,
                contribution_amount NUMERIC DEFAULT 100,
                pot_total NUMERIC DEFAULT 0
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS participants (
                id SERIAL PRIMARY KEY,
                phone_number VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(100),
                has_paid BOOLEAN DEFAULT FALSE,
                cycle_id INTEGER REFERENCES rosca_cycles(id)
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS bot_sessions (
                chat_id VARCHAR(255) PRIMARY KEY,
                data JSONB,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Create a default cycle if none exists
        const res = await db.query('SELECT * FROM rosca_cycles LIMIT 1');
        if (res.rows.length === 0) {
            await db.query("INSERT INTO rosca_cycles (status) VALUES ('pending')");
            console.log("Created default ROSCA cycle.");
        }

        console.log("Database schema initialized.");
        process.exit(0);
    } catch (err) {
        console.error("Error initializing DB:", err);
        process.exit(1);
    }
}

initDB();
