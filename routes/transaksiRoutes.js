const express = require('express');
const { CreateTransaksi, GetTransaksiBeli, GetTransaksiJual } = require('../controllers/transaksiController');

const router = express.Router();

router.post('/buat-transaksi', CreateTransaksi);

router.get('/get-transaksi-beli', GetTransaksiBeli);

router.get('/get-transaksi-jual', GetTransaksiJual);

module.exports = router;
