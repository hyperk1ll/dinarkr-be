const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../models/User');
require('dotenv').config();

const register = async (req, res) => {
    const { nama, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await createUser(nama, email, hashedPassword);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: 'User already exists' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await findUserByEmail(email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, nama_user: user.nama, email: email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token, nama: user.nama, email: user.email });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
};

const checkSession = (req, res) => {
    res.status(200).json({ user: req.user });
};

const logout = (req, res) => {
    res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = { register, login, checkSession, logout };
