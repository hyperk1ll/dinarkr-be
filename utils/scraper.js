const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../config/db');

const months = {
    'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
    'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
    'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
};

/**
 * Mengambil data produk dinar dari API resmi dinarkr.com
 */
async function fetchFromOfficialApi() {
    const [tabelRes, prodRes, paketRes] = await Promise.all([
        axios.get('https://admin.dinarkr.com/api/v1/tabel-harga', { timeout: 10000 }),
        axios.get('https://admin.dinarkr.com/api/v1/products', { timeout: 10000 }).catch(() => ({ data: { data: [] } })),
        axios.get('https://admin.dinarkr.com/api/v1/pakets', { timeout: 10000 }).catch(() => ({ data: { data: [] } }))
    ]);

    const rawList = tabelRes.data?.data || [];
    const meta = tabelRes.data?.meta || {};
    const webTimestamp = meta.updated_at ? new Date(meta.updated_at) : new Date();
    const todayStrFromWeb = meta.tanggal || (meta.updated_at ? meta.updated_at.split('T')[0] : new Date().toISOString().split('T')[0]);

    const prodMap = {};
    (prodRes.data?.data || []).forEach(p => { prodMap[p.slug] = p; });
    (paketRes.data?.data || []).forEach(p => { prodMap['paket-' + p.key] = p; });

    const products = rawList.map(item => {
        const extra = prodMap[item.slug];
        let altName = null;
        if (item.label === 'Paket Exclusive') altName = 'Paket Dinar Exclusive 1 Set';
        if (item.label === 'Paket Luxury') altName = 'Paket Dinar Luxury 1 Set';

        return {
            name: item.label,
            altName,
            slug: item.slug,
            konsumen: Number(item.jual),
            buyback: Number(item.buyback),
            image: extra?.gridImg || extra?.img || null,
            keterangan: extra?.subheadline || extra?.desc || 'Dinar Khoirur Rooziqiin'
        };
    });

    return { products, webTimestamp, todayStrFromWeb };
}

/**
 * Fallback: scraping dari HTML lama dinarkr jika API tidak tersedia
 */
async function fetchFromHtmlFallback() {
    const response = await axios.get('https://dinarkr.com/main/harga-emas.php?action=dkrharga', { timeout: 10000 });
    const $ = cheerio.load(response.data);
    const products = [];

    let webTimestamp = null;
    let todayStrFromWeb = null;
    const spans = $('.dkr-tgl div span');
    if (spans.length >= 2) {
        const dateStr = $(spans[0]).text().trim();
        const timeStr = $(spans[1]).text().trim().replace('.', ':');
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
        webTimestamp = new Date();
        const dateQuery = await pool.query(`SELECT TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') as today_str`);
        todayStrFromWeb = dateQuery.rows[0].today_str;
    }

    $('div.dkr-harga1 .table-dkr tbody tr').each((i, el) => {
        const name = $(el).find('img').attr('alt')?.trim();
        const konsumen = $(el).find('.konsumen span').first().text().replace(/\./g, '').trim();
        const buyback = $(el).find('.buyback span').first().text().replace(/\./g, '').trim();
        const image = $(el).find('img').attr('src');
        
        if (name && konsumen && buyback) {
            products.push({
                name,
                altName: null,
                konsumen: parseInt(konsumen, 10),
                buyback: parseInt(buyback, 10),
                image: image ? `https://dinarkr.com/${image}` : null,
                keterangan: 'Dinar Khoirur Rooziqiin'
            });
        }
    });

    $('.dkr-harga2-item').each((i, el) => {
        const imgAlt = $(el).find('img').attr('alt');
        let name = imgAlt ? imgAlt.trim() : '';
        if ($(el).find('h4').length > 0) {
            name = $(el).find('h4').text().replace(/\s+/g, ' ').trim();
        }
        
        const konsumen = $(el).find('.harga span').first().text().replace(/\./g, '').trim();
        const buyback = $(el).find('.buyback2 span').first().text().replace(/\./g, '').trim();
        const image = $(el).find('img').attr('src');
        
        if (name && konsumen && buyback && name.toLowerCase() !== '10 dinar' && name.toLowerCase() !== '20 dinar') {
            products.push({
                name,
                altName: null,
                konsumen: parseInt(konsumen, 10),
                buyback: parseInt(buyback, 10),
                image: image ? `https://dinarkr.com/${image}` : null,
                keterangan: 'Dinar Khoirur Rooziqiin'
            });
        }
    });

    return { products, webTimestamp, todayStrFromWeb };
}

const syncHargaDinar = async () => {
    try {
        console.log("Memulai sinkronisasi harga dinar...");

        let scrapeResult;
        try {
            console.log("Mencoba mengambil data dari API resmi dinarkr.com/harga...");
            scrapeResult = await fetchFromOfficialApi();
            console.log("Berhasil mengambil data via API resmi.");
        } catch (apiErr) {
            console.warn("Gagal mengambil data dari API resmi, beralih ke HTML fallback:", apiErr.message);
            scrapeResult = await fetchFromHtmlFallback();
        }

        const { products, webTimestamp, todayStrFromWeb } = scrapeResult;
        console.log(`Ditemukan ${products.length} produk dinar.`);

        let changedCount = 0;

        for (const prod of products) {
            const checkQuery = await pool.query(
                'SELECT id, harga_konsumen, harga_buyback FROM produk_dinar WHERE nama = $1 OR nama = $2',
                [prod.name, prod.altName || prod.name]
            );

            let idDinar;

            if (checkQuery.rows.length === 0) {
                // Insert produk baru
                const insertQuery = await pool.query(`
                    INSERT INTO produk_dinar (nama, harga_konsumen, harga_buyback, keterangan, gambar, jumlah_stok, terakhir_diperbarui)
                    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
                `, [prod.name, prod.konsumen, prod.buyback, prod.keterangan || 'Dinar Khoirur Rooziqiin', prod.image, 0, webTimestamp]);
                
                idDinar = insertQuery.rows[0].id;
                console.log(`Produk baru ditambahkan: ${prod.name} (ID: ${idDinar})`);
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
                    if (last.date_str === todayStrFromWeb) {
                        isNewDay = false;
                    }
                    if (Number(last.harga_konsumen) === prod.konsumen && Number(last.harga_buyback) === prod.buyback) {
                        isPriceChanged = false;
                    }
                } else {
                    isPriceChanged = true;
                }

                // Update data produk master
                await pool.query(`
                    UPDATE produk_dinar 
                    SET harga_konsumen = $1, harga_buyback = $2, 
                        gambar = COALESCE($3, gambar), keterangan = COALESCE($4, keterangan),
                        terakhir_diperbarui = $5
                    WHERE id = $6
                `, [prod.konsumen, prod.buyback, prod.image, prod.keterangan, webTimestamp, idDinar]);

                // Tambah riwayat jika hari baru atau harga berubah
                if (isNewDay || isPriceChanged) {
                    await pool.query(`
                        INSERT INTO riwayat_harga_dinar (id_dinar, harga_konsumen, harga_buyback, tanggal)
                        VALUES ($1, $2, $3, $4)
                    `, [idDinar, prod.konsumen, prod.buyback, webTimestamp]);

                    changedCount++;
                    if (isPriceChanged) {
                        console.log(`Harga berubah untuk ${prod.name} (${oldKonsumen.toLocaleString('id-ID')} -> ${prod.konsumen.toLocaleString('id-ID')}). Riwayat disimpan.`);
                    } else {
                        console.log(`Hari baru untuk ${prod.name}. Riwayat disimpan dengan harga tetap.`);
                    }
                }
            }
        }

        console.log(`Selesai sinkronisasi harga dinar. ${changedCount} riwayat/produk diperbarui.`);
        return { success: true, count: products.length, changed: changedCount };

    } catch (error) {
        console.error("Gagal melakukan sinkronisasi:", error);
        return { success: false, error: error.message };
    }
};

module.exports = syncHargaDinar;
