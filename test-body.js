const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://dinarkr.com/').then(res => {
    const $ = cheerio.load(res.data);
    console.log($('body').text());
});
