const express = require('express');
const { CreateDinar, GetDinar, GetDinarById, UpdateDinar, SyncHarga, GetRiwayatHargaById, GetHargaByDate } = require('../controllers/produkDinarController');

const router = express.Router();

router.post('/tambah-dinar', CreateDinar);

router.get('/get-dinar', GetDinar);

router.get('/get-dinar/:id', GetDinarById);

router.put('/update-dinar/:id', UpdateDinar);

router.get('/sync-harga', SyncHarga);

router.get('/riwayat-harga/:id', GetRiwayatHargaById);

router.get('/harga-by-date', GetHargaByDate);

module.exports = router;
