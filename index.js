const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const produkDinarRoutes = require('./routes/produkDinarRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/produk', produkDinarRoutes);
app.use('/api/transaksi', transaksiRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
