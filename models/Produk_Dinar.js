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

module.exports = { AddDinar, getDinar };
