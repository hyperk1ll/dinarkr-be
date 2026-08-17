const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ...(process.env.CA_CERTIFICATE ? {
        ssl: {
            rejectUnauthorized: true,
            ca: process.env.CA_CERTIFICATE
        }
    } : {
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    }),
});

module.exports = pool;
