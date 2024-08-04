const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { register, login, checkSession, logout } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', authMiddleware, checkSession);
router.post('/logout', authMiddleware, logout)

module.exports = router;
