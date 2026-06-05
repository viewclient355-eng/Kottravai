require('dotenv').config({path: './server/.env'});
const cartRecoveryService = require('./server/services/cartRecoveryService');

cartRecoveryService.runRecoveryJob()
  .then(res => console.log('Job finished:', res))
  .catch(console.error);
