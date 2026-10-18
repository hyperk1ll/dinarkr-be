require('dotenv').config();
const axios = require('axios');
const pool = require('./config/db');

// Rasio buyback resmi DinarKR per pecahan
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

async function backfillHistory() {
    try {
        console.log("Memulai penarikan data riwayat harga dari dinarkr.com...");

        // Ambil ID semua produk dari database
        const prodRes = await pool.query('SELECT id, nama FROM produk_dinar ORDER BY id ASC');

        for (const prod of prodRes.rows) {
            const slug = SLUGS_MAP[prod.nama];
            if (!slug) continue; // lewati paket exclusive/luxury

            console.log(`\nMenarik riwayat untuk ${prod.nama} (${slug})...`);
            try {
                const res = await axios.get(`https://admin.dinarkr.com/api/v1/harga/riwayat?slug=${slug}`, { timeout: 15000 });
                const historyList = (res.data?.data || []).filter(item => item.harga > 0);
                const ratio = BUYBACK_RATIOS[slug] || 0.95;

                // 1. Ambil semua tanggal yang sudah ada di DB untuk produk ini (1 query cepat)
                const existingRes = await pool.query(
                    `SELECT TO_CHAR(tanggal, 'YYYY-MM-DD') as tgl FROM riwayat_harga_dinar WHERE id_dinar = $1`,
                    [prod.id]
                );
                const existingDates = new Set(existingRes.rows.map(r => r.tgl));

                // 2. Filter data baru yang belum pernah disimpan
                const newRows = [];
                for (const item of historyList) {
                    const timestamp = new Date(item.time);
                    const dateStr = item.time.split('T')[0];

                    if (!existingDates.has(dateStr)) {
                        const jual = Number(item.harga);
                        const buyback = Math.round((jual * ratio) / 1000) * 1000;
                        newRows.push({ jual, buyback, timestamp });
                        existingDates.add(dateStr); // hindari duplikat di hari yang sama
                    }
                }

                if (newRows.length === 0) {
                    console.log(`Tidak ada riwayat baru untuk ${prod.nama} (semua tanggal sudah ada).`);
                    continue;
                }

                // 3. Batch insert (chunk 200 baris per query agar sangat cepat dan aman)
                const CHUNK_SIZE = 200;
                let inserted = 0;

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
                    inserted += chunk.length;
                }

                console.log(`Berhasil menambahkan ${inserted} riwayat baru untuk ${prod.nama}.`);

            } catch (err) {
                console.error(`Gagal menarik riwayat untuk ${prod.nama}:`, err.message);
            }
        }

        console.log("\nProses penarikan riwayat harga masa lalu selesai dengan sukses!");
    } catch (err) {
        console.error("Terjadi kesalahan:", err);
    } finally {
        pool.end();
    }
}

backfillHistory();
