const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../config/db');

const months = {
    'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
    'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
    'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
};


const syncHargaDinar = async () => {
    try {
        console.log("Memulai sinkronisasi harga dinar...");
        const response = await axios.get('https://dinarkr.com/main/harga-emas.php?action=dkrharga');
        const $ = cheerio.load(response.data);

        const products = [];

        // Ambil timestamp dari website
        let webTimestamp = null;
        let todayStrFromWeb = null;
        const spans = $('.dkr-tgl div span');
        if (spans.length >= 2) {
            const dateStr = $(spans[0]).text().trim(); // ex: "17 Agustus 2026"
            const timeStr = $(spans[1]).text().trim().replace('.', ':'); // ex: "10:14"
            
            const parts = dateStr.split(' ');
            if (parts.length === 3) {
                const [day, monthStr, year] = parts;
                const month = months[monthStr];
                if (day && month && year && timeStr) {
                    const isoString = `${year}-${month}-${day.padStart(2, '0')}T${timeStr}:00+07:00`;
                    webTimestamp = new Date(isoString);
                    todayStrFromWeb = `${year}-${month}-${day.padStart(2, '0')}`;
                }
            }
        }

        if (!webTimestamp) {
            console.error("Gagal mem-parsing tanggal dari website, menggunakan waktu lokal");
            webTimestamp = new Date();
            const dateQuery = await pool.query(`SELECT TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') as today_str`);
            todayStrFromWeb = dateQuery.rows[0].today_str;
        }

        // 1. Ambil dinar standar
        $('div.dkr-harga1 .table-dkr tbody tr').each((i, el) => {
            const name = $(el).find('img').attr('alt').trim();
            const konsumen = $(el).find('.konsumen span').first().text().replace(/\./g, '').trim();
            const buyback = $(el).find('.buyback span').first().text().replace(/\./g, '').trim();
            const image = $(el).find('img').attr('src');
            
            if (name && konsumen && buyback) {
                products.push({
                    name,
                    konsumen: parseInt(konsumen, 10),
                    buyback: parseInt(buyback, 10),
                    image: `https://dinarkr.com/${image}`
                });
            }
        });

        // 2. Ambil paket dinar exclusive/luxury
        $('.dkr-harga2-item').each((i, el) => {
            const imgAlt = $(el).find('img').attr('alt');
            let name = imgAlt ? imgAlt.trim() : '';
            if ($(el).find('h4').length > 0) {
                name = $(el).find('h4').text().replace(/\s+/g, ' ').trim();
            }
            
            const konsumen = $(el).find('.harga span').first().text().replace(/\./g, '').trim();
            const buyback = $(el).find('.buyback2 span').first().text().replace(/\./g, '').trim();
            const image = $(el).find('img').attr('src');
            
            // Hindari duplikat "10 dinar" / "20 Dinar" yg sudah ada di tabel 1
            if (name && konsumen && buyback && name.toLowerCase() !== '10 dinar' && name.toLowerCase() !== '20 dinar') {
                products.push({
                    name,
                    konsumen: parseInt(konsumen, 10),
                    buyback: parseInt(buyback, 10),
                    image: `https://dinarkr.com/${image}`
                });
            }
        });

        console.log(`Berhasil mengambil ${products.length} produk dari website.`);

        let changedCount = 0;

        // 3. Simpan ke database
        for (const prod of products) {
            // Cek apakah produk sudah ada
            const checkQuery = await pool.query('SELECT id, harga_konsumen, harga_buyback FROM produk_dinar WHERE nama = $1', [prod.name]);
            
            let idDinar;

            if (checkQuery.rows.length === 0) {
                // Insert produk baru
                const insertQuery = await pool.query(`
                    INSERT INTO produk_dinar (nama, harga_konsumen, harga_buyback, keterangan, gambar, jumlah_stok, terakhir_diperbarui)
                    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
                `, [prod.name, prod.konsumen, prod.buyback, 'Scraped automatically', prod.image, 0, webTimestamp]);
                idDinar = insertQuery.rows[0].id;
                console.log(`Produk baru ditambahkan: ${prod.name}`);
                changedCount++;

                // Tambah riwayat harga pertama
                await pool.query(`
                    INSERT INTO riwayat_harga_dinar (id_dinar, harga_konsumen, harga_buyback, tanggal)
                    VALUES ($1, $2, $3, $4)
                `, [idDinar, prod.konsumen, prod.buyback, webTimestamp]);

            } else {
                idDinar = checkQuery.rows[0].id;
                const oldKonsumen = Number(checkQuery.rows[0].harga_konsumen);
                const oldBuyback = Number(checkQuery.rows[0].harga_buyback);

                // Gunakan tanggal dari website
                const todayStr = todayStrFromWeb;

                // Cek riwayat terakhir untuk id_dinar ini
                const lastRiwayatQuery = await pool.query(`
                    SELECT harga_konsumen, harga_buyback, 
                           TO_CHAR((tanggal AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') as date_str
                    FROM riwayat_harga_dinar 
                    WHERE id_dinar = $1 
                    ORDER BY tanggal DESC LIMIT 1
                `, [idDinar]);

                let isNewDay = true;
                let isPriceChanged = true;

                if (lastRiwayatQuery.rows.length > 0) {
                    const last = lastRiwayatQuery.rows[0];
                    if (last.date_str === todayStr) {
                        isNewDay = false;
                    }
                    if (Number(last.harga_konsumen) === prod.konsumen && Number(last.harga_buyback) === prod.buyback) {
                        isPriceChanged = false;
                    }
                } else {
                    // Jika belum ada riwayat sama sekali
                    isPriceChanged = true;
                }

                // Selalu update produk_dinar agar terakhir_diperbarui sesuai dengan waktu website (terverifikasi)
                await pool.query(`
                    UPDATE produk_dinar 
                    SET harga_konsumen = $1, harga_buyback = $2, gambar = $3, terakhir_diperbarui = $4
                    WHERE id = $5
                `, [prod.konsumen, prod.buyback, prod.image, webTimestamp, idDinar]);

                // Tambah riwayat JIKA ini hari baru (walau harga sama) ATAU harga berubah di hari yang sama
                if (isNewDay || isPriceChanged) {
                    await pool.query(`
                        INSERT INTO riwayat_harga_dinar (id_dinar, harga_konsumen, harga_buyback, tanggal)
                        VALUES ($1, $2, $3, $4)
                    `, [idDinar, prod.konsumen, prod.buyback, webTimestamp]);

                    changedCount++;
                    if (isPriceChanged) {
                        console.log(`Harga berubah untuk ${prod.name}. Riwayat disimpan.`);
                    } else {
                        console.log(`Hari baru untuk ${prod.name}. Riwayat disimpan dengan harga tetap.`);
                    }
                }
            }
        }

        console.log(`Selesai sinkronisasi harga dinar. ${changedCount} produk diupdate.`);
        return { success: true, count: products.length, changed: changedCount };

    } catch (error) {
        console.error("Gagal melakukan sinkronisasi:", error);
        return { success: false, error: error.message };
    }
};

module.exports = syncHargaDinar;
