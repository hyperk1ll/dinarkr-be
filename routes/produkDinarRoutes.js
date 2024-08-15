const express = require('express');
const { CreateDinar, GetDinar, GetDinarById, UpdateDinar } = require('../controllers/produkDinarController');

const router = express.Router();

router.post('/tambah-dinar', CreateDinar);

router.get('/get-dinar', GetDinar);

router.get('/get-dinar/:id', GetDinarById);

router.put('/update-dinar/:id', UpdateDinar);

module.exports = router;
