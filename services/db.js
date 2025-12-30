const { Pool } = require('pg');
require('dotenv').config();

// Ensure we have a connection string
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
