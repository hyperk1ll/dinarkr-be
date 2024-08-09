const pool = require('../config/db');

const Transaksi = async (tipe_transaksi, pembelian_dari, tanggal_transaksi, nama_pembeli, details) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Memulai transaksi

        // Eksekusi query pertama
        const result = await client.query(
            'INSERT INTO transaksi (tipe_transaksi, pembelian_dari, tanggal_transaksi, nama_pembeli) VALUES ($1, $2, $3, $4) RETURNING id_transaksi',
            [tipe_transaksi, pembelian_dari, tanggal_transaksi, nama_pembeli]
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

const getAllTransaksi = async () => {
    const result = await pool.query(`
      SELECT t.id_transaksi, t.tipe_transaksi, t.pembelian_dari, t.tanggal_transaksi, t.nama_pembeli,
             d.id_dinar, d.jumlah, d.harga_satuan
      FROM transaksi t
      LEFT JOIN detail_transaksi d ON t.id_transaksi = d.id_transaksi
      ORDER BY t.tanggal_transaksi DESC
    `);
    return result.rows;
}

const getTransaksiById = async (id_transaksi) => {
    const result = await pool.query(
        `SELECT t.id_transaksi, t.tipe_transaksi, t.pembelian_dari, t.tanggal_transaksi, t.nama_pembeli,
            d.id_dinar, d.jumlah, d.harga_satuan
            FROM transaksi t
            LEFT JOIN detail_transaksi d ON t.id_transaksi = d.id_transaksi
            WHERE t.id_transaksi = $1
            ORDER BY t.tanggal_transaksi DESC;
        `, [id_transaksi]
    );
    return result.rows;
}

const getTransaksiBeli = async () => {
    const result = await pool.query(
        `SELECT t.id_transaksi, t.tipe_transaksi, t.pembelian_dari, t.tanggal_transaksi, t.nama_pembeli,
            d.id_dinar, d.jumlah, d.harga_satuan
            FROM transaksi t
            LEFT JOIN detail_transaksi d ON t.id_transaksi = d.id_transaksi
            WHERE t.tipe_transaksi = 'beli'
            ORDER BY t.tanggal_transaksi DESC;
        `
    );
    return result.rows;
}

const getTransaksiJual = async () => {
    const result = await pool.query(
        `SELECT t.id_transaksi, t.tipe_transaksi, t.pembelian_dari, t.tanggal_transaksi, t.nama_pembeli,
            d.id_dinar, d.jumlah, d.harga_satuan
            FROM transaksi t
            LEFT JOIN detail_transaksi d ON t.id_transaksi = d.id_transaksi
            WHERE t.tipe_transaksi = 'jual'
            ORDER BY t.tanggal_transaksi DESC;
        `
    );
    return result.rows;
}

const editTransaksi = async (id_transaksi, tipe_transaksi, pembelian_dari, tanggal_transaksi, nama_pembeli, details) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Memulai transaksi

        // Eksekusi query untuk update transaksi
        await client.query(
            'UPDATE transaksi SET tipe_transaksi = $1, pembelian_dari = $2, tanggal_transaksi = $3, nama_pembeli = $4 WHERE id_transaksi = $5',
            [tipe_transaksi, pembelian_dari, tanggal_transaksi, nama_pembeli, id_transaksi]
        );

        // Ambil detail transaksi lama
        const { rows: oldDetails } = await client.query(
            'SELECT id_dinar, jumlah FROM detail_transaksi WHERE id_transaksi = $1',
            [id_transaksi]
        );

        // Hapus detail transaksi lama
        await client.query(
            'DELETE FROM detail_transaksi WHERE id_transaksi = $1',
            [id_transaksi]
        );

        for (const detail of details) {
            // Masukkan detail transaksi baru
            await client.query(
                'INSERT INTO detail_transaksi (id_transaksi, id_dinar, jumlah, harga_satuan) VALUES ($1, $2, $3, $4)',
                [id_transaksi, detail.id_dinar, detail.jumlah, detail.harga_satuan]
            );

            // Cari detail lama yang sesuai
            const oldDetail = oldDetails.find(d => d.id_dinar === detail.id_dinar);
            const oldJumlah = oldDetail ? oldDetail.jumlah : 0;
            const jumlahSelisih = detail.jumlah - oldJumlah;

            // Update stok_dinar berdasarkan tipe_transaksi
            if (tipe_transaksi === "beli") {
                await client.query(
                    'UPDATE produk_dinar SET jumlah_stok = jumlah_stok + $1, terakhir_diperbarui = CURRENT_TIMESTAMP WHERE id = $2',
                    [jumlahSelisih, detail.id_dinar]
                );
            } else if (tipe_transaksi === "jual") {
                await client.query(
                    'UPDATE produk_dinar SET jumlah_stok = jumlah_stok - $1, terakhir_diperbarui = CURRENT_TIMESTAMP WHERE id = $2',
                    [jumlahSelisih, detail.id_dinar]
                );
            }
        }

        await client.query('COMMIT'); // Mengkomit transaksi
        return { id_transaksi };

    } catch (e) {
        await client.query('ROLLBACK'); // Membatalkan transaksi jika ada error
        throw e;
    }
    finally {
        client.release(); // Melepas koneksi kembali ke pool
    }
}


const deleteTransaksi = async (id_transaksi) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Memulai transaksi

        // Dapatkan tipe_transaksi dari transaksi sebelum dihapus
        const { rows: transaksiRows } = await client.query(
            'SELECT tipe_transaksi FROM transaksi WHERE id_transaksi = $1',
            [id_transaksi]
        );

        if (transaksiRows.length === 0) {
            throw new Error('Transaksi tidak ditemukan');
        }

        const tipe_transaksi = transaksiRows[0].tipe_transaksi;

        // Dapatkan detail transaksi sebelum dihapus
        const { rows: details } = await client.query(
            'SELECT id_dinar, jumlah FROM detail_transaksi WHERE id_transaksi = $1',
            [id_transaksi]
        );

        // Update stok_dinar sebelum menghapus transaksi
        for (const detail of details) {
            if (tipe_transaksi === 'beli') {
                await client.query(
                    'UPDATE produk_dinar SET jumlah_stok = jumlah_stok - $1 WHERE id = $2',
                    [detail.jumlah, detail.id_dinar]
                );
            } else if (tipe_transaksi === 'jual') {
                await client.query(
                    'UPDATE produk_dinar SET jumlah_stok = jumlah_stok + $1 WHERE id = $2',
                    [detail.jumlah, detail.id_dinar]
                );
            }
        }

        // Eksekusi query untuk menghapus detail transaksi
        await client.query(
            'DELETE FROM detail_transaksi WHERE id_transaksi = $1',
            [id_transaksi]
        );

        // Eksekusi query untuk menghapus transaksi
        await client.query(
            'DELETE FROM transaksi WHERE id_transaksi = $1',
            [id_transaksi]
        );

        await client.query('COMMIT'); // Mengkomit transaksi
    }
    catch (e) {
        await client.query('ROLLBACK'); // Membatalkan transaksi jika ada error
        throw e;
    }
    finally {
        client.release(); // Melepas koneksi kembali ke pool
    }
}




module.exports = { Transaksi, getAllTransaksi, getTransaksiById, getTransaksiBeli, getTransaksiJual, editTransaksi, deleteTransaksi };