require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createUser } = require('./models/User');

const seedUser = async () => {
    try {
        const nama = "Admin Dinar";
        const email = "admin@dinar.kr";
        const password = "password123";

        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser(nama, email, hashedPassword);

        console.log(`User berhasil dibuat!`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } catch (err) {
        console.error("Gagal membuat user. Mungkin email sudah terdaftar?", err.message);
    } finally {
        process.exit();
    }
};

seedUser();
