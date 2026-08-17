require('dotenv').config();
const pool = require('./config/db');
async function test() {
    const res = await pool.query(`SELECT nama, terakhir_diperbarui::text FROM produk_dinar`);
    console.log(res.rows);
    pool.end();
}
test();
