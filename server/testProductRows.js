require('dotenv').config();
const { fetchRawEventRows, buildAggregations } = require('./services/googleSheetsService');
const { sheets } = require('./utils/googleSheetsConfig');

async function checkProduct() {
  try {
    const s = await sheets();
    console.log('Fetching raw events...');
    const rows = await fetchRawEventRows(s);
    console.log(`Fetched ${rows.length} rows.`);
    const aggregation = buildAggregations(rows);
    console.log(`Total Products Aggregated: ${aggregation.totalProductsAggregated}`);
    
    const targetProduct = "Kottravai Handwoven Natural Bottle Holder Sling Bag";
    const found = aggregation.productRows.find(p => p.productName.toLowerCase() === targetProduct.toLowerCase());
    
    if (found) {
      console.log(`✅ SUCCESS: Found product! Views: ${found.views}, Carts: ${found.carts}, Purchases: ${found.purchases}`);
    } else {
      console.log(`❌ FAILED: Product "${targetProduct}" not found in aggregation.`);
    }
  } catch(e) {
    console.error('Error:', e);
  }
}

checkProduct();
