const pool = require('../config/db');

const Transaksi = async (tipe_transaksi, tanggal_transaksi, nama_pembeli, details) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Memulai transaksi

        // Eksekusi query pertama
        const result = await client.query(
            'INSERT INTO transaksi (tipe_transaksi, tanggal_transaksi, nama_pembeli) VALUES ($1, $2, $3) RETURNING id_transaksi',
            [tipe_transaksi, tanggal_transaksi, nama_pembeli]
        );
        const id_transaksi = result.rows[0].id_transaksi;

        // Eksekusi query kedua
        for (const detail of details) {
            await client.query(
                'INSERT INTO detail_transaksi (id_transaksi, id_dinar, jumlah, harga_satuan) VALUES ($1, $2, $3, $4)',
                [id_transaksi, detail.id_dinar, detail.jumlah, detail.harga_satuan]
            );

            // Update stok_dinar berdasarkan tipe_transaksi
            if (tipe_transaksi === "beli") {
                await client.query(
                    'UPDATE produk_dinar SET jumlah_stok = jumlah_stok + $1, terakhir_diperbarui = CURRENT_TIMESTAMP WHERE id = $2',
                    [detail.jumlah, detail.id_dinar]
                );
            } else if (tipe_transaksi === "jual") {
                await client.query(
                    'UPDATE produk_dinar SET jumlah_stok = jumlah_stok - $1, terakhir_diperbarui = CURRENT_TIMESTAMP WHERE id = $2',
                    [detail.jumlah, detail.id_dinar]
                );
            }
        }

        await client.query('COMMIT'); // Mengkomit transaksi
        return { id_transaksi };
    } catch (e) {
        await client.query('ROLLBACK'); // Membatalkan transaksi jika ada error
        throw e;
    } finally {
        client.release(); // Melepas koneksi kembali ke pool
    }
}

const getTransaksiBeli = async () => {
    const result = await pool.query(
        `SELECT * FROM transaksi WHERE tipe_transaksi = 'beli'`
    );
    return result.rows;
}

const getTransaksiJual = async () => {
    const result = await pool.query(
        `SELECT * FROM transaksi WHERE tipe_transaksi = 'jual'`
    );
    return result.rows;
}

module.exports = { Transaksi, getTransaksiBeli, getTransaksiJual };