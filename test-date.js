require('dotenv').config();
const pool = require('./config/db');
pool.query(`SELECT TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI:SS') as today_str, (SELECT TO_CHAR((tanggal AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI:SS') FROM riwayat_harga_dinar ORDER BY tanggal DESC LIMIT 1) as last_date`).then(res => { console.log(res.rows); pool.end(); });
