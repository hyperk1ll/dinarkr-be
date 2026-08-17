const axios = require('axios');
axios.get('https://dinarkr.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(res => {
    console.log(res.data);
});
