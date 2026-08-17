const axios = require('axios');
const cheerio = require('cheerio');

async function scrape() {
  try {
    const res = await axios.get('https://dinarkr.com/');
    console.log(res.data.substring(0, 1500));
    const $ = cheerio.load(res.data);
    const text = $('#hgemas').text();
    console.log("hgemas text: ", text);
  } catch (err) {
    console.error(err);
  }
}

scrape();
