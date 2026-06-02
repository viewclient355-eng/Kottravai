const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const sheetsService = require('./services/googleSheetsService');

async function executeCleanup() {
    const s = await sheetsService.sheets();

    console.log("=== PHASE 4: Executing Cleanup ===");
    
    // Fetch all rows
    const response = await s.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Raw Events!A1:Z'
    });
    const values = response.data.values || [];
    if (values.length <= 1) {
        console.log("No data found.");
        return;
    }
    
    const headersRaw = values[0];
    const normalizeKey = (key) => {
        if (key === undefined || key === null) return '';
        return String(key).trim().toLowerCase().replace(/\s+/g, '_');
    };
    const headers = headersRaw.map(h => normalizeKey(h));
    
    const validRowsToRetain = [headersRaw]; // Keep headers
    let deletedCount = 0;

    for (let i = 1; i < values.length; i++) {
        const rowData = values[i];
        const row = {};
        headers.forEach((header, index) => {
            row[header] = rowData[index] !== undefined ? rowData[index] : '';
        });

        const isCorrupted = row['event_type'] === 'unknown' && 
                            (!row['visitor_id'] || row['visitor_id'].trim() === '') && 
                            (!row['session_id'] || row['session_id'].trim() === '');
        
        if (isCorrupted) {
            deletedCount++;
        } else {
            validRowsToRetain.push(rowData);
        }
    }

    console.log(`Corrupted Rows to Delete: ${deletedCount}`);
    console.log(`Valid Rows to Retain (including header): ${validRowsToRetain.length}`);

    // Update the sheet by clearing and writing back the valid rows
    console.log("Clearing existing data...");
    await s.spreadsheets.values.clear({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Raw Events!A1:Z'
    });

    console.log("Writing valid rows back...");
    await s.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Raw Events!A1:Z',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: validRowsToRetain
        }
    });

    console.log("Cleanup complete!");

    console.log("\n=== PHASE 5: Post-Cleanup Validation ===");
    
    // Use buildAggregations to get the metrics directly from the retained rows (we need objects for buildAggregations)
    const retainedObjects = validRowsToRetain.slice(1).map(rowData => {
        const result = {};
        headers.forEach((header, index) => {
            result[header] = rowData[index] !== undefined ? rowData[index] : '';
        });
        return result;
    });

    const aggregations = sheetsService.buildAggregations(retainedObjects);
    
    console.log(`Total Rows Remaining: ${retainedObjects.length}`);
    console.log(`Unique Visitors: ${aggregations.summary.totalVisitors}`);
    console.log(`Unique Sessions: ${aggregations.summary.totalSessions}`);
    console.log(`Orders: ${aggregations.summary.totalOrders}`);
    console.log(`Revenue: ${aggregations.summary.totalRevenue}`);
    console.log(`Event Distribution:`);
    console.log(JSON.stringify(aggregations.globalFunnel, null, 2));

}

executeCleanup().catch(console.error);
