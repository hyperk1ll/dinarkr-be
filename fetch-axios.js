const axios = require('axios');
axios.get('https://dinarkr.com/').then(res => {
    require('fs').writeFileSync('dinarkr_axios.html', res.data);
    console.log("Written dinarkr_axios.html");
});
