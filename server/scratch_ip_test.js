const axios = require('axios');
async function test() {
  const ip = '8.8.8.8, 1.1.1.1';
  try {
    const res = await axios.get(`https://ipwho.is/${ip}`);
    console.log(res.data);
  } catch(e) {
    console.log('Error', e.message);
  }
}
test();
