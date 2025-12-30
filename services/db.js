const { createClient } = require("@libsql/client");
require('dotenv').config();

const client = createClient({
    url: process.env.BUNNY_DB_URL || "file:local.db",
    authToken: process.env.BUNNY_DB_AUTH_TOKEN
});

// Adapter to mimic PG client interface
const query = async (text, params = []) => {
    // Robust parameter replacement for $n -> ?
    // We need to map the values from the original params array to the new linear order of ?
    
    const newParams = [];
    const sql = text.replace(/\$(\d+)/g, (match, index) => {
        // Postgres params are 1-based, array is 0-based
        const valIndex = parseInt(index, 10) - 1;
        newParams.push(params[valIndex]);
        return '?';
    });

    try {
        const rs = await client.execute({ sql, args: newParams });
        
        // Transform LibSQL rows (which might be objects if named cols, or arrays)
        // LibSQL client normally returns rows as objects { col: val } which is compatible with PG { rows: [{col: val}] }
        
        return {
            rows: rs.rows,
            rowCount: rs.rows.length
        };
    } catch (e) {
        console.error("SQL Error:", e.message);
        console.error("Original Query:", text);
        console.error("Transformed Query:", sql);
        throw e;
    }
};

module.exports = {
    query
};
