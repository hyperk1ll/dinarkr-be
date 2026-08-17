const pool = require('../config/db');

const AddDinar = async (nama, harga_konsumen, harga_buyback, keterangan, gambar) => {
    const result = await pool.query(
        'INSERT INTO produk_dinar (nama, harga_konsumen, harga_buyback, keterangan, gambar) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [nama, harga_konsumen, harga_buyback, keterangan, gambar]
    );
    return result.rows[0];
};

const getDinar = async () => {
    const result = await pool.query(
        'SELECT * FROM produk_dinar'
    );
    return result.rows;
};

const getDinarById = async (id) => {
    const result = await pool.query(
        'SELECT * FROM produk_dinar WHERE id = $1',
        [id]
    );
    return result.rows[0];
};

const updateDinar = async (id, nama, harga_konsumen, harga_buyback, keterangan, gambar) => {
    const result = await pool.query(
        'UPDATE produk_dinar SET nama = $1, harga_konsumen = $2, harga_buyback = $3, keterangan = $4, gambar = $5 WHERE id = $6 RETURNING *',
        [nama, harga_konsumen, harga_buyback, keterangan, gambar, id]
    );
    return result.rows[0];
}

const getRiwayatHargaById = async (id) => {
    const result = await pool.query(
        'SELECT * FROM riwayat_harga_dinar WHERE id_dinar = $1 ORDER BY tanggal ASC',
        [id]
    );
    return result.rows;
};

const getHargaByDateAndId = async (id, date) => {
    // Cari harga terakhir untuk id_dinar ini pada atau sebelum tanggal/waktu yang diminta
    const result = await pool.query(
        `SELECT harga_konsumen, harga_buyback 
         FROM riwayat_harga_dinar 
         WHERE id_dinar = $1 AND tanggal <= $2::timestamp
         ORDER BY tanggal DESC LIMIT 1`,
        [id, date]
    );
    return result.rows[0];
};

module.exports = { AddDinar, getDinar, getDinarById, updateDinar, getRiwayatHargaById, getHargaByDateAndId };
