const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://dinarkr.com/').then(res => {
    const $ = cheerio.load(res.data);
    const updateElements = $('*:contains("Update")');
    updateElements.each((i, el) => {
        if ($(el).children().length === 0) { // only print deepest elements
            console.log($(el).text().trim());
        }
    });
});
