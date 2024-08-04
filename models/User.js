const pool = require('../config/db');

const createUser = async (nama, email, password) => {
    const result = await pool.query(
        'INSERT INTO users (nama, email, password) VALUES ($1, $2, $3) RETURNING *',
        [nama, email, password]
    );
    return result.rows[0];
};

const findUserByEmail = async (email) => {
    const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );
    return result.rows[0];
};

module.exports = { createUser, findUserByEmail };
