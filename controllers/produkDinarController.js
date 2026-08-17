
const { AddDinar, getDinar, getDinarById, updateDinar, getRiwayatHargaById, getHargaByDateAndId } = require('../models/Produk_Dinar');
const syncHargaDinar = require('../utils/scraper');

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

const GetDinarById = async (req, res) => {
    const id = req.params.id;
    try {
        const dinar = await getDinarById(id);
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

const UpdateDinar = async (req, res) => {
    const id = req.params.id;
    const { nama, harga_konsumen, harga_buyback, keterangan, gambar } = req.body;
    try {
        const dinar = await updateDinar(id, nama, harga_konsumen, harga_buyback, keterangan, gambar);
        res.status(200).json({
            error: false,
            message: 'Data dinar berhasil diupdate',
            data: dinar
        });
    } catch (error) {
        res.status(500).json({ 
            error: true,
            message: 'Gagal update data dinar'
        });
    }
}

const SyncHarga = async (req, res) => {
    try {
        const result = await syncHargaDinar();
        if (result.success) {
            res.status(200).json({
                error: false,
                message: 'Harga berhasil disinkronisasi',
                data: result
            });
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'Gagal sinkronisasi harga',
            detail: error.message
        });
    }
}

const GetRiwayatHargaById = async (req, res) => {
    const id = req.params.id;
    try {
        const riwayat = await getRiwayatHargaById(id);
        res.status(200).json({
            error: false,
            data: riwayat
        });
    } catch (error) {
        res.status(500).json({ 
            error: true,
            message: 'Gagal mendapatkan data riwayat harga'
        });
    }
}

const GetHargaByDate = async (req, res) => {
    const id = req.query.id_dinar;
    const date = req.query.tanggal; // ex: 2026-08-17
    
    if (!id || !date) {
        return res.status(400).json({ error: true, message: 'id_dinar dan tanggal harus disertakan' });
    }

    try {
        const harga = await getHargaByDateAndId(id, date);
        if (harga) {
            res.status(200).json({
                error: false,
                data: harga
            });
        } else {
            res.status(404).json({
                error: true,
                message: 'Tidak ada data harga yang ditemukan untuk produk dan tanggal tersebut'
            });
        }
    } catch (error) {
        res.status(500).json({ 
            error: true,
            message: 'Gagal mendapatkan data harga',
            detail: error.message
        });
    }
}

module.exports = { CreateDinar, GetDinar, GetDinarById, UpdateDinar, SyncHarga, GetRiwayatHargaById, GetHargaByDate };