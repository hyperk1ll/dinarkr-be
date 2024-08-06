const express = require('express');
const { CreateTransaksi, GetAllTransaksi, GetTransaksiBeli, GetTransaksiJual } = require('../controllers/transaksiController');

const router = express.Router();

router.post('/buat-transaksi', CreateTransaksi);

router.get('/get-all-transaksi', GetAllTransaksi);

router.get('/get-transaksi-beli', GetTransaksiBeli);

router.get('/get-transaksi-jual', GetTransaksiJual);

module.exports = router;
