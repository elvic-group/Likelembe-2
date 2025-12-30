const { Pool } = require('pg');
require('dotenv').config();

// Ensure we have a connection string
if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing!");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // This is required for Neon
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
