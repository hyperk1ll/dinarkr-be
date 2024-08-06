
const { Transaksi, getAllTransaksi, getTransaksiById, getTransaksiBeli, getTransaksiJual, editTransaksi, deleteTransaksi } = require('../models/Transaksi');


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

const GetTransaksiById = async (req, res) => {
    const { id_transaksi } = req.params;
    try {
        const transaksi = await getTransaksiById(id_transaksi);

        if (transaksi.length === 0) {
            res.status(404).json({
                error: true,
                message: 'Data transaksi tidak ditemukan'
            });
        }
        else {

            res.status(200).json({
                error: false,
                data: transaksi
            });
        }
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

const EditTransaksi = async (req, res) => {
    const { id_transaksi } = req.params;
    const { tipe_transaksi, pembelian_dari, tanggal_transaksi, nama_pembeli, detail } = req.body;
    try {
        const transaksi = await editTransaksi(id_transaksi, tipe_transaksi, pembelian_dari, tanggal_transaksi, nama_pembeli, detail);
        res.status(200).json({
            error: false,
            message: 'Data transaksi berhasil diubah',
            data: transaksi
        });
    }
    catch (error) {
        res.status(500).json({
            error: true,
            message: 'Gagal mengubah data transaksi'
        });
    }
}

const DeleteTransaksi = async (req, res) => {
    const { id_transaksi } = req.params;
    try {
        const transaksi = await deleteTransaksi(id_transaksi);
        res.status(200).json({
            error: false,
            message: 'Data transaksi berhasil dihapus',
            data: transaksi
        });
    }
    catch (error) {
        res.status(500).json({
            error: true,
            message: 'Gagal menghapus data transaksi'
        });
    }
}

module.exports = { CreateTransaksi, GetAllTransaksi, GetTransaksiById, GetTransaksiBeli, GetTransaksiJual, EditTransaksi, DeleteTransaksi };