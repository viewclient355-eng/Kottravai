require('dotenv').config({path: './server/.env'});
const googleSheetsService = require('./server/services/googleSheetsService');

async function run() {
  const agg = await googleSheetsService.getAggregations();
  const withPhone = agg.visitorProfiles.filter(vp => vp.phone);
  console.log(`Visitors with phone: ${withPhone.length}`);
  if (withPhone.length > 0) {
    console.log(withPhone[0]);
  }
}
run().catch(console.error);
