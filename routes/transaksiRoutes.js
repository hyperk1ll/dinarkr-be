const express = require('express');
const { CreateTransaksi, GetAllTransaksi, GetTransaksiById, GetTransaksiBeli, GetTransaksiJual, EditTransaksi, DeleteTransaksi } = require('../controllers/transaksiController');

const router = express.Router();

router.post('/buat-transaksi', CreateTransaksi);

router.get('/get-all-transaksi', GetAllTransaksi);

router.get('/get-transaksi/:id_transaksi', GetTransaksiById);

router.get('/get-transaksi-beli', GetTransaksiBeli);

router.get('/get-transaksi-jual', GetTransaksiJual);

router.put('/edit-transaksi/:id_transaksi', EditTransaksi);

router.delete('/delete-transaksi/:id_transaksi', DeleteTransaksi);

module.exports = router;
