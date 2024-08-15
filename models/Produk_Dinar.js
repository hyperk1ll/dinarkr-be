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

module.exports = { AddDinar, getDinar, getDinarById, updateDinar };
