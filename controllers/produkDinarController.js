
const { AddDinar, getDinar } = require('../models/Produk_Dinar');

const CreateDinar = async (req, res) => {
    const { nama, harga_konsumen, harga_buyback, keterangan, gambar } = req.body;
    try {
        const dinar = await AddDinar(nama, harga_konsumen, harga_buyback, keterangan, gambar);
        res.status(201).json({
            error: false,
            message: 'Data dinar berhasil ditambahkan',
            data: dinar
        });
    } catch (error) {
        res.status(500).json({ 
            error: true,
            message: 'Gagal menambahkan data dinar'
        });
    }
}

const GetDinar = async (req, res) => {
    try {
        const dinar = await getDinar();
        res.status(200).json({
            error: false,
            data: dinar
        });
    } catch (error) {
        res.status(500).json({ 
            error: true,
            message: 'Gagal mendapatkan data dinar'
        });
    }
}

module.exports = { CreateDinar, GetDinar };