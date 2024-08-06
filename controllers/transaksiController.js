
const { Transaksi, getAllTransaksi, getTransaksiBeli, getTransaksiJual } = require('../models/Transaksi');


const CreateTransaksi = async (req, res) => {
    const { tipe_transaksi, pembelian_dari, tanggal_transaksi, nama_pembeli, detail } = req.body;
    try {
        const transaksi = await Transaksi(tipe_transaksi, pembelian_dari, tanggal_transaksi, nama_pembeli, detail);
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

const GetAllTransaksi = async (req, res) => {
    try {
        const transaksi = await getAllTransaksi();
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
            message: 'Gagal mendapatkan data transaksi beli'
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
            message: 'Gagal mendapatkan data transaksi jual'
        });
    }
}

module.exports = { CreateTransaksi, GetAllTransaksi, GetTransaksiBeli, GetTransaksiJual };