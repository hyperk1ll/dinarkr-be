require('dotenv').config();
const pool = require('../config/db');

const addRiwayatHargaTable = async () => {
    try {
        console.log("Membuat tabel riwayat_harga_dinar...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS riwayat_harga_dinar (
                id SERIAL PRIMARY KEY,
                id_dinar INTEGER REFERENCES produk_dinar(id) ON DELETE CASCADE,
                tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                harga_konsumen NUMERIC NOT NULL,
                harga_buyback NUMERIC NOT NULL
            );
        `);
        console.log("Berhasil membuat tabel riwayat_harga_dinar!");
    } catch (err) {
        console.error("Gagal membuat tabel riwayat_harga_dinar:", err);
    } finally {
        pool.end();
    }
};

addRiwayatHargaTable();
