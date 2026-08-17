const axios = require('axios');
const cheerio = require('cheerio');

const months = {
    'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
    'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
    'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
};

async function testParse() {
    const res = await axios.get('https://dinarkr.com/main/harga-emas.php?action=dkrharga');
    const $ = cheerio.load(res.data);
    const spans = $('.dkr-tgl div span');
    if (spans.length >= 2) {
        const dateStr = $(spans[0]).text().trim(); // "17 Agustus 2026"
        const timeStr = $(spans[1]).text().trim().replace('.', ':'); // "10:14"
        
        const [day, monthStr, year] = dateStr.split(' ');
        const month = months[monthStr];
        
        const isoString = `${year}-${month}-${day.padStart(2, '0')}T${timeStr}:00+07:00`; // WIB is +07:00
        console.log("Parsed ISO string:", isoString);
        console.log("Date object:", new Date(isoString));
    } else {
        console.log("Could not find date spans");
    }
}
testParse();
