require('dotenv').config();
const pool = require('./config/db');

const initDB = async () => {
    try {
        console.log("Memulai inisialisasi database...");
        
        // Buat tabel users
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                nama VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            );
        `);
        console.log("Tabel 'users' berhasil dicek/dibuat.");

        // Buat tabel produk_dinar
        await pool.query(`
            CREATE TABLE IF NOT EXISTS produk_dinar (
                id SERIAL PRIMARY KEY,
                nama VARCHAR(255) NOT NULL,
                harga_konsumen NUMERIC NOT NULL,
                harga_buyback NUMERIC NOT NULL,
                keterangan TEXT,
                gambar TEXT,
                jumlah_stok NUMERIC DEFAULT 0,
                terakhir_diperbarui TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Tabel 'produk_dinar' berhasil dicek/dibuat.");

        // Buat tabel transaksi
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transaksi (
                id_transaksi SERIAL PRIMARY KEY,
                tipe_transaksi VARCHAR(50) NOT NULL,
                pembelian_dari VARCHAR(255),
                tanggal_transaksi TIMESTAMP NOT NULL,
                nama_pembeli VARCHAR(255)
            );
        `);
        console.log("Tabel 'transaksi' berhasil dicek/dibuat.");

        // Buat tabel detail_transaksi
        await pool.query(`
            CREATE TABLE IF NOT EXISTS detail_transaksi (
                id_detail SERIAL PRIMARY KEY,
                id_transaksi INTEGER REFERENCES transaksi(id_transaksi) ON DELETE CASCADE,
                id_dinar INTEGER REFERENCES produk_dinar(id) ON DELETE CASCADE,
                jumlah NUMERIC NOT NULL,
                harga_satuan NUMERIC NOT NULL
            );
        `);
        console.log("Tabel 'detail_transaksi' berhasil dicek/dibuat.");

        console.log("Inisialisasi database selesai!");
    } catch (err) {
        console.error("Gagal melakukan inisialisasi database:", err);
    } finally {
        pool.end();
    }
};

initDB();
