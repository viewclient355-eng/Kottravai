require('dotenv').config({path: './server/.env'});
const { getAggregations } = require('./server/services/googleSheetsService.js');

async function run() {
  console.log('Fetching aggregations...');
  const agg = await getAggregations();
  console.log('Cart Instances count:', agg.cartInstances.length);
  console.log('Phone number for visitor profiles:', agg.visitorProfiles.filter(vp => vp.phone).length);
}
run().catch(console.error);
