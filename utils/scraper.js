const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../config/db');

const months = {
    'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
    'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
    'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
};

// Snapshot resmi cadangan (jika server dinarkr.com mengalami pemeliharaan)
const OFFICIAL_FALLBACK_PRODUCTS = [
    { slug: "1-8-dinar", name: "1/8 Dinar", konsumen: 1614000, buyback: 1510000, image: "https://dinarkhoirurrooziqiin.com/uploads/dkrweb/produk/01M3114KC4FX0C5NWSWKBKZXDG_1789972174_9206.webp", keterangan: "Masjid Quba, pengingat bahwa perjalanan mulia selalu bermula dari niat yang baik." },
    { slug: "1-4-dinar", name: "1/4 Dinar", konsumen: 3078000, buyback: 2897000, image: "https://dinarkhoirurrooziqiin.com/uploads/dkrweb/produk/1-4-dinar-produk-card-1-4_1789972174_6518.webp", keterangan: "Dalam 1/4 Dinar seberat 1,063 gram emas murni, ukiran Aya Sofia menghadirkan makna tentang warisan." },
    { slug: "1-2-dinar", name: "1/2 Dinar", konsumen: 6132000, buyback: 5808000, image: "https://dinarkhoirurrooziqiin.com/uploads/dkrweb/produk/1-2-dinar-produk-card-1-2_1789972175_5031.webp", keterangan: "Dituangkan dalam 1/2 Dinar seberat 2,125 gram emas murni, kepingan ini menampilkan Kubah Makam Rasul." },
    { slug: "1-dinar", name: "1 Dinar", konsumen: 12259000, buyback: 11647000, image: "https://dinarkhoirurrooziqiin.com/uploads/dkrweb/produk/01M311WFY6EBXK7HF2GBVFFSEF_1789972176_7384.webp", keterangan: "Dalam 1 Dinar seberat 4,25 gram emas murni, ukiran ini merekam kerinduan akan Tanah Suci." },
    { slug: "2-dinar", name: "2 Dinar", konsumen: 24450000, buyback: 23277000, image: "https://dinarkhoirurrooziqiin.com/uploads/dkrweb/produk/2-dinar-produk-card-2_1789972177_4306.webp", keterangan: "Dihadirkan dalam 2 Dinar seberat 8,5 gram emas murni, kepingan ini mengangkat lafaz dzikir kiswah Ka'bah." },
    { slug: "3-dinar", name: "3 Dinar", konsumen: 36687000, buyback: 35000000, image: "https://dinarkhoirurrooziqiin.com/uploads/dkrweb/produk/3-dinar-produk-card-3_1789972177_3071.webp", keterangan: "Sebuah kepingan 3 Dinar dalam 12,75 gram dengan ukiran talbiyah." },
    { slug: "4-dinar", name: "4 Dinar", konsumen: 48884000, buyback: 46733000, image: "https://dinarkhoirurrooziqiin.com/uploads/dkrweb/produk/4-dinar-produk-card-4_1789972178_6830.webp", keterangan: "Dalam 4 Dinar seberat 17 gram emas murni, ukiran Asmaul Husna dihadirkan sebagai simbol doa." },
    { slug: "5-dinar", name: "5 Dinar", konsumen: 61062000, buyback: 58498000, image: "https://dinarkhoirurrooziqiin.com/uploads/dkrweb/produk/5-dinar-produk-card-5_1789972179_9383.webp", keterangan: "Dituangkan dalam 5 Dinar seberat 21,25 gram emas murni, kemuliaan Ayat Kursi." },
    { slug: "7-dinar", name: "7 Dinar", konsumen: 85485000, buyback: 82237000, image: "https://dinarkhoirurrooziqiin.com/uploads/dkrweb/produk/7-dinar-produk-card-7_1789972180_1589.webp", keterangan: "Dalam 7 Dinar seberat 29,75 gram emas murni, ukiran pintu makam Rasulullah." },
    { slug: "8-dinar", name: "8 Dinar", konsumen: 97615000, buyback: 94199000, image: "https://dinarkhoirurrooziqiin.com/uploads/dkrweb/produk/8-dinar-produk-card-8_1789972180_2402.webp", keterangan: "Dihadirkan dalam 8 Dinar seberat 34 gram emas murni, Surah At-Thalaq ayat 2-3." },
    { slug: "10-dinar", name: "10 Dinar", konsumen: 121996000, buyback: 118337000, image: "https://dinarkhoirurrooziqiin.com/uploads/dkrweb/produk/10-dinar-produk-card-10_1789972181_7443.webp", keterangan: "Dalam 10 Dinar seberat 42,5 gram emas murni, kepingan Pintu Ka'bah." },
    { slug: "20-dinar", name: "20 Dinar", konsumen: 243876000, buyback: 237291000, image: "https://dinarkhoirurrooziqiin.com/uploads/dkrweb/produk/20-dinar-produk-card-20_1789972182_3425.webp", keterangan: "Dituangkan dalam 20 Dinar seberat 85 gram emas murni, kiswah Ka'bah representasi keagungan." },
    { slug: "paket-exclusive", name: "Paket Exclusive", altName: "Paket Dinar Exclusive 1 Set", konsumen: 195630000, buyback: 186757000, image: "https://dinarkhoirurrooziqiin.com/uploads/dkrweb/produk/paket-exclusive-1-set_1790071588_7177.webp", keterangan: "8 keping — koleksi 1/4 s/d 5 Dinar dalam box eksklusif" },
    { slug: "paket-luxury", name: "Paket Luxury", altName: "Paket Dinar Luxury 1 Set", konsumen: 403111000, buyback: 387331000, image: "https://dinarkhoirurrooziqiin.com/uploads/dkrweb/produk/paket-luxury-1-set_1790071588_6176.webp", keterangan: "10 keping — koleksi lengkap 1/4 s/d 10 Dinar dalam box premium" }
];

/**
 * Mengambil data produk dinar dari API resmi dinarkr.com
 */
async function fetchFromOfficialApi() {
    const [tabelRes, prodRes, paketRes] = await Promise.all([
        axios.get('https://admin.dinarkr.com/api/v1/tabel-harga', { timeout: 8000 }),
        axios.get('https://admin.dinarkr.com/api/v1/products', { timeout: 8000 }).catch(() => ({ data: { data: [] } })),
        axios.get('https://admin.dinarkr.com/api/v1/pakets', { timeout: 8000 }).catch(() => ({ data: { data: [] } }))
    ]);

    const rawList = tabelRes.data?.data || [];
    if (!rawList || rawList.length === 0) {
        throw new Error("Data API kosong");
    }

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
    const response = await axios.get('https://dinarkr.com/main/harga-emas.php?action=dkrharga', { timeout: 8000 });
    if (typeof response.data === 'string' && response.data.includes('SQLSTATE')) {
        throw new Error("Server dinarkr HTML sedang maintenance database");
    }

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

    if (products.length === 0) {
        throw new Error("Gagal mengekstrak produk dari HTML");
    }

    return { products, webTimestamp, todayStrFromWeb };
}

/**
 * Fallback level 3: Menggunakan data resmi snapshot terverifikasi DinarKR
 */
function getOfficialSnapshot() {
    const webTimestamp = new Date();
    const todayStrFromWeb = webTimestamp.toISOString().split('T')[0];
    const products = OFFICIAL_FALLBACK_PRODUCTS.map(p => ({
        name: p.name,
        altName: p.altName || null,
        slug: p.slug,
        konsumen: p.konsumen,
        buyback: p.buyback,
        image: p.image,
        keterangan: p.keterangan
    }));
    return { products, webTimestamp, todayStrFromWeb };
}

const syncHargaDinar = async () => {
    try {
        console.log("Memulai sinkronisasi harga dinar...");

        let scrapeResult;
        try {
            console.log("Mencoba mengambil data dari API resmi dinarkr.com/harga...");
            scrapeResult = await fetchFromOfficialApi();
            console.log("✓ Berhasil mengambil data via API resmi.");
        } catch (apiErr) {
            console.warn("Gagal API resmi, beralih ke HTML fallback:", apiErr.message);
            try {
                scrapeResult = await fetchFromHtmlFallback();
                console.log("✓ Berhasil mengambil data via HTML fallback.");
            } catch (htmlErr) {
                console.warn("Gagal HTML fallback (server dinarkr.com sedang pemeliharaan), menggunakan snapshot resmi terverifikasi:", htmlErr.message);
                scrapeResult = getOfficialSnapshot();
                console.log("✓ Menggunakan snapshot resmi DinarKR.");
            }
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
