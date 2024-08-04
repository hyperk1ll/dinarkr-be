const express = require('express');
const { CreateDinar, GetDinar } = require('../controllers/produkDinarController');

const router = express.Router();

router.post('/tambah-dinar', CreateDinar);

router.get('/get-dinar', GetDinar);

module.exports = router;
