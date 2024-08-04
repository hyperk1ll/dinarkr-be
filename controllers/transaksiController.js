
const { Transaksi, getTransaksiBeli, getTransaksiJual } = require('../models/Transaksi');


const CreateTransaksi = async (req, res) => {
    const { tipe_transaksi, tanggal_transaksi, nama_pembeli, detail } = req.body;
    try {
        const transaksi = await Transaksi(tipe_transaksi, tanggal_transaksi, nama_pembeli, detail);
        res.status(201).json({
            error: false,
            message: 'Data transaksi berhasil ditambahkan',
            data: transaksi
        });
    }
    catch (error) {
        res.status(500).json({
            error: true,
            message: 'Gagal menambahkan data transaksi'
        });
    }
}

const GetTransaksiBeli = async (req, res) => {
    try {
        const transaksi = await getTransaksiBeli();
        res.status(200).json({
            error: false,
            data: transaksi
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'Gagal mendapatkan data transaksi'
        });
    }
}

const GetTransaksiJual = async (req, res) => {
    try {
        const transaksi = await getTransaksiJual();
        res.status(200).json({
            error: false,
            data: transaksi
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'Gagal mendapatkan data transaksi'
        });
    }
}

module.exports = { CreateTransaksi, GetTransaksiBeli, GetTransaksiJual };