const cron = require('node-cron');
const syncHargaDinar = require('./scraper');

// Jadwal: Setiap jam di menit ke-0 (setiap 1 jam)
cron.schedule('0 * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Menjalankan cron job sinkronisasi harga (per jam)...`);
    await syncHargaDinar();
}, {
    scheduled: true,
    timezone: "Asia/Jakarta" // Zona waktu WIB
});

console.log("Scheduler cron job sinkronisasi harga berhasil diinisialisasi.");
