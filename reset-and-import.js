require('dotenv').config();
const bcrypt = require('bcryptjs');
const axios = require('axios');
const pool = require('./config/db');
const syncHargaDinar = require('./utils/scraper');

const BUYBACK_RATIOS = {
    '1-8-dinar': 0.9356,
    '1-4-dinar': 0.9412,
    '1-2-dinar': 0.9472,
    '1-dinar': 0.9501,
    '2-dinar': 0.9520,
    '3-dinar': 0.9540,
    '4-dinar': 0.9560,
    '5-dinar': 0.9580,
    '7-dinar': 0.9620,
    '8-dinar': 0.9650,
    '10-dinar': 0.9700,
    '20-dinar': 0.9730,
};

const SLUGS_MAP = {
    '1/8 Dinar': '1-8-dinar',
    '1/4 Dinar': '1-4-dinar',
    '1/2 Dinar': '1-2-dinar',
    '1 Dinar': '1-dinar',
    '2 Dinar': '2-dinar',
    '3 Dinar': '3-dinar',
    '4 Dinar': '4-dinar',
    '5 Dinar': '5-dinar',
    '7 Dinar': '7-dinar',
    '8 Dinar': '8-dinar',
    '10 Dinar': '10-dinar',
    '20 Dinar': '20-dinar',
};

async function resetAndImport() {
    try {
        console.log("==================================================");
        console.log("1. MEMULAI RESET DATABASE (DROP & RECREATE TABLES)");
        console.log("==================================================");

        await pool.query(`
            DROP TABLE IF EXISTS detail_transaksi CASCADE;
            DROP TABLE IF EXISTS transaksi CASCADE;
            DROP TABLE IF EXISTS riwayat_harga_dinar CASCADE;
            DROP TABLE IF EXISTS produk_dinar CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
        `);
        console.log("✓ Berhasil membersihkan seluruh tabel lama.");

        // Tabel users
        await pool.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                nama VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            );
        `);
        console.log("✓ Tabel 'users' berhasil dibuat.");

        // Tabel produk_dinar
        await pool.query(`
            CREATE TABLE produk_dinar (
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
        console.log("✓ Tabel 'produk_dinar' berhasil dibuat.");

        // Tabel riwayat_harga_dinar
        await pool.query(`
            CREATE TABLE riwayat_harga_dinar (
                id SERIAL PRIMARY KEY,
                id_dinar INTEGER REFERENCES produk_dinar(id) ON DELETE CASCADE,
                tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                harga_konsumen NUMERIC NOT NULL,
                harga_buyback NUMERIC NOT NULL
            );
        `);
        console.log("✓ Tabel 'riwayat_harga_dinar' berhasil dibuat.");

        // Tabel transaksi
        await pool.query(`
            CREATE TABLE transaksi (
                id_transaksi SERIAL PRIMARY KEY,
                tipe_transaksi VARCHAR(50) NOT NULL,
                pembelian_dari VARCHAR(255),
                tanggal_transaksi TIMESTAMP NOT NULL,
                nama_pembeli VARCHAR(255)
            );
        `);
        console.log("✓ Tabel 'transaksi' berhasil dibuat.");

        // Tabel detail_transaksi
        await pool.query(`
            CREATE TABLE detail_transaksi (
                id_detail SERIAL PRIMARY KEY,
                id_transaksi INTEGER REFERENCES transaksi(id_transaksi) ON DELETE CASCADE,
                id_dinar INTEGER REFERENCES produk_dinar(id) ON DELETE CASCADE,
                jumlah NUMERIC NOT NULL,
                harga_satuan NUMERIC NOT NULL
            );
        `);
        console.log("✓ Tabel 'detail_transaksi' berhasil dibuat.");

        // Seed user admin
        const hashedPassword = await bcrypt.hash("password123", 10);
        await pool.query(`
            INSERT INTO users (nama, email, password)
            VALUES ($1, $2, $3)
        `, ["Admin Dinar", "admin@dinar.kr", hashedPassword]);
        console.log("✓ Admin user berhasil dibuat (email: admin@dinar.kr, password: password123)");

        console.log("\n==================================================");
        console.log("2. SINKRONISASI PRODUK DINAR RESMI (1/8 s/d PAKET)");
        console.log("==================================================");

        const syncResult = await syncHargaDinar();
        console.log(`✓ Sinkronisasi produk selesai: ${syncResult.count} produk ditambahkan.`);

        console.log("\n==================================================");
        console.log("3. IMPORT SEMUA RIWAYAT HISTORIS HARGA (SEJAK 2020)");
        console.log("==================================================");

        const prodRes = await pool.query('SELECT id, nama FROM produk_dinar ORDER BY id ASC');

        for (const prod of prodRes.rows) {
            const slug = SLUGS_MAP[prod.nama];
            if (!slug) {
                console.log(`- ${prod.nama}: Dilewati (Bundling Paket tidak memiliki riwayat terpisah).`);
                continue;
            }

            try {
                const res = await axios.get(`https://admin.dinarkr.com/api/v1/harga/riwayat?slug=${slug}`, { timeout: 15000 });
                const historyList = (res.data?.data || []).filter(item => item.harga > 0);
                const ratio = BUYBACK_RATIOS[slug] || 0.95;

                // Ambil tanggal yang sudah ada
                const existingRes = await pool.query(
                    `SELECT TO_CHAR(tanggal, 'YYYY-MM-DD') as tgl FROM riwayat_harga_dinar WHERE id_dinar = $1`,
                    [prod.id]
                );
                const existingDates = new Set(existingRes.rows.map(r => r.tgl));

                const newRows = [];
                for (const item of historyList) {
                    const timestamp = new Date(item.time);
                    const dateStr = item.time.split('T')[0];

                    if (!existingDates.has(dateStr)) {
                        const jual = Number(item.harga);
                        const buyback = Math.round((jual * ratio) / 1000) * 1000;
                        newRows.push({ jual, buyback, timestamp });
                        existingDates.add(dateStr);
                    }
                }

                if (newRows.length > 0) {
                    const CHUNK_SIZE = 250;
                    for (let i = 0; i < newRows.length; i += CHUNK_SIZE) {
                        const chunk = newRows.slice(i, i + CHUNK_SIZE);
                        const values = [];
                        const params = [prod.id];
                        let paramIdx = 2;

                        for (const row of chunk) {
                            values.push(`($1, $${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2})`);
                            params.push(row.jual, row.buyback, row.timestamp);
                            paramIdx += 3;
                        }

                        const query = `
                            INSERT INTO riwayat_harga_dinar (id_dinar, harga_konsumen, harga_buyback, tanggal)
                            VALUES ${values.join(', ')}
                        `;
                        await pool.query(query, params);
                    }
                    console.log(`✓ ${prod.nama.padEnd(16)} (ID: ${prod.id}): Berhasil mengimpor ${newRows.length} riwayat harga.`);
                } else {
                    console.log(`- ${prod.nama.padEnd(16)} (ID: ${prod.id}): Data riwayat sudah up-to-date.`);
                }
            } catch (err) {
                console.error(`✕ Gagal menarik riwayat untuk ${prod.nama}:`, err.message);
            }
        }

        console.log("\n==================================================");
        console.log("4. VERIFIKASI AKHIR DATABASE");
        console.log("==================================================");

        const checkProds = await pool.query('SELECT id, nama, harga_konsumen, harga_buyback FROM produk_dinar ORDER BY id ASC');
        console.table(checkProds.rows);

        const totalRiwayatRes = await pool.query('SELECT count(*) FROM riwayat_harga_dinar');
        console.log(`Total seluruh riwayat harga di database: ${totalRiwayatRes.rows[0].count} data titik.`);

        console.log("\nProses RESET & IMPORT ULANG DATABASE SELESAI DENGAN SEMPURNA!");

    } catch (err) {
        console.error("Terjadi kegagalan:", err);
    } finally {
        pool.end();
    }
}

resetAndImport();
