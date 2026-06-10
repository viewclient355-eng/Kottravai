const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { google } = require('googleapis');
const { validateAndRepairKey } = require('./utils/googleKeyValidator');

async function run() {
    let key = process.env.GOOGLE_PRIVATE_KEY || '';
    key = validateAndRepairKey(key);
    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL || '';
    if (clientEmail.startsWith('"')) clientEmail = clientEmail.slice(1, -1);
    
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: key },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const sheets = google.sheets({ version: 'v4', auth });
    let spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (spreadsheetId.startsWith('"')) spreadsheetId = spreadsheetId.slice(1, -1);

    console.log(`\n--- HISTORICAL PRODUCT ANALYTICS VALIDATION ---\n`);

    // 1. Fetch Raw Events
    const rawRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Raw Events'!A1:Z" });
    const rawRows = rawRes.data.values || [];
    if (rawRows.length < 2) {
        console.log("No Raw Events found.");
        return;
    }
    
    const rawHeaders = rawRows[0].map(h => h.toLowerCase().replace(/ /g, '_'));
    const tIdx = rawHeaders.indexOf('timestamp');
    const eIdx = rawHeaders.indexOf('event_type');
    const pNameIdx = rawHeaders.indexOf('product_name');
    const catIdx = rawHeaders.indexOf('category');
    const totalIdx = rawHeaders.indexOf('order_total');
    
    // Aggregations from Raw Events
    let counts = { product_view: 0, category_view: 0, add_to_cart: 0, checkout_started: 0, purchase_completed: 0 };
    let rawTotals = { views: 0, cartAdds: 0, purchases: 0, revenue: 0 };
    let rawProducts = new Map();
    let rawCategories = new Map();

    for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        const eventType = (row[eIdx] || '').toLowerCase();
        const pName = (row[pNameIdx] || '').trim();
        const cat = (row[catIdx] || '').trim();
        const total = parseFloat(row[totalIdx]) || 0;
        
        if (counts.hasOwnProperty(eventType)) counts[eventType]++;
        
        if (pName) {
            if (!rawProducts.has(pName)) {
                rawProducts.set(pName, { views: 0, cartAdds: 0, purchases: 0, revenue: 0 });
            }
            const p = rawProducts.get(pName);
            if (eventType === 'product_view') { p.views++; rawTotals.views++; }
            if (eventType === 'add_to_cart') { p.cartAdds++; rawTotals.cartAdds++; }
            if (eventType === 'purchase_completed') { p.purchases++; rawTotals.purchases++; p.revenue += total; rawTotals.revenue += total; }
        }
        
        if (cat) {
            // Include category_view for legacy data test
            if (!rawCategories.has(cat)) rawCategories.set(cat, 0);
            rawCategories.set(cat, rawCategories.get(cat) + 1);
        }
    }

    console.log(`Headers: ${rawHeaders.join(', ')}`);
    console.log(`catIdx: ${catIdx}, eIdx: ${eIdx}, pNameIdx: ${pNameIdx}, totalIdx: ${totalIdx}`);
    
    console.log(`\nSTEP 1: Raw Events Counts`);
    console.log(`Product Views: ${counts.product_view}`);
    console.log(`Category Views: ${counts.category_view}`);
    console.log(`Add To Cart: ${counts.add_to_cart}`);
    console.log(`Checkout Started: ${counts.checkout_started}`);
    console.log(`Purchase Completed: ${counts.purchase_completed}\n`);
    
    console.log(`STEP 2: Raw Events Aggregations`);
    console.log(`Total Product Views: ${rawTotals.views}`);
    console.log(`Total Add To Cart: ${rawTotals.cartAdds}`);
    console.log(`Total Purchases: ${rawTotals.purchases}`);
    console.log(`Total Revenue: ${rawTotals.revenue}\n`);

    // 2. Fetch Product Analytics
    const prodRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Product Analytics'!A1:Z" });
    const prodRows = prodRes.data.values || [];
    
    let prodTotals = { views: 0, cartAdds: 0, purchases: 0, revenue: 0 };
    let prodProducts = new Map();
    
    for (let i = 1; i < prodRows.length; i++) {
        const row = prodRows[i];
        const pName = (row[0] || '').trim();
        const views = parseInt(row[1]) || 0;
        const cartAdds = parseInt(row[2]) || 0;
        const purchases = parseInt(row[3]) || 0;
        const revenue = parseFloat((row[4] || '0').replace(/[^0-9.-]+/g,"")) || 0; // Strip currency symbols
        
        if (pName) {
            prodProducts.set(pName, { views, cartAdds, purchases, revenue });
            prodTotals.views += views;
            prodTotals.cartAdds += cartAdds;
            prodTotals.purchases += purchases;
            prodTotals.revenue += revenue;
        }
    }

    console.log(`STEP 3: Totals Comparison`);
    console.log(`[Views]     Raw: ${rawTotals.views} | Sheet: ${prodTotals.views}`);
    console.log(`[Cart Adds] Raw: ${rawTotals.cartAdds} | Sheet: ${prodTotals.cartAdds}`);
    console.log(`[Purchases] Raw: ${rawTotals.purchases} | Sheet: ${prodTotals.purchases}`);
    console.log(`[Revenue]   Raw: ${rawTotals.revenue} | Sheet: ${prodTotals.revenue}\n`);
    
    console.log(`STEP 4: Top 10 Products Validation`);
    const topRawProducts = Array.from(rawProducts.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue || b[1].purchases - a[1].purchases || b[1].views - a[1].views)
        .slice(0, 10);
        
    for (const [pName, rawP] of topRawProducts) {
        const prodP = prodProducts.get(pName) || { views: 0, cartAdds: 0, purchases: 0, revenue: 0 };
        const match = rawP.views === prodP.views && rawP.cartAdds === prodP.cartAdds && rawP.purchases === prodP.purchases && rawP.revenue === prodP.revenue;
        console.log(`- ${pName}`);
        console.log(`  Raw   -> V: ${rawP.views}, C: ${rawP.cartAdds}, P: ${rawP.purchases}, R: ${rawP.revenue}`);
        console.log(`  Sheet -> V: ${prodP.views}, C: ${prodP.cartAdds}, P: ${prodP.purchases}, R: ${prodP.revenue}`);
        console.log(`  Match -> ${match ? 'YES' : 'NO'}`);
    }
    console.log('');

    // Fetch Traffic Analytics for Categories? 
    // The dashboard builder builds top category per day, but doesn't have a category sheet!
    // Wait, the prompt says "Compare: Raw Events category totals vs Product Analytics category totals". 
    // Let's look for a Category column in Product Analytics.
    console.log(`STEP 5: Category Validation`);
    console.log(`(Product Analytics sheet doesn't have a category breakdown natively in the dashboard, but let's see if legacy data maps)`);
    console.log(`Raw Categories found: ${Array.from(rawCategories.keys()).length}`);
    for (const [cat, count] of rawCategories.entries()) {
        console.log(`  - ${cat}: ${count}`);
    }
    
    console.log(`\nSTEP 6: Revenue Validation`);
    console.log(`Raw Events Total Revenue: ${rawTotals.revenue}`);
    console.log(`Product Analytics Revenue: ${prodTotals.revenue}`);
    
    console.log(`\n================================================\n`);
}

run().catch(console.error);
