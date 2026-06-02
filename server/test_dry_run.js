const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const sheetsService = require('./services/googleSheetsService');

async function runPhases() {
    const s = await sheetsService.sheets();

    console.log("=== PHASE 1: Aggregation Fix Dry-Run ===");
    const rows = await sheetsService.fetchRawEventRows(s);
    console.log(`Total Raw Events fetched: ${rows.length}`);
    
    if (rows.length > 0) {
        console.log("\nSample Object from fetchRawEventRows():");
        console.log(rows[0]);
    }
    
    const aggregations = sheetsService.buildAggregations(rows);
    console.log("\nAggregation Output:");
    console.log(`Unique Visitors: ${aggregations.summary.totalVisitors}`);
    console.log(`Unique Sessions: ${aggregations.summary.totalSessions}`);
    console.log(`Orders: ${aggregations.summary.totalOrders}`);
    console.log(`Revenue: ${aggregations.summary.totalRevenue}`);
    console.log(`Event Distribution:`, aggregations.globalFunnel);

    console.log("\n=== PHASE 2: Corruption Audit ===");
    let validRows = 0;
    let corruptedRows = 0;
    const sampleCorrupted = [];
    const sampleValid = [];
    
    // Corruption Criteria:
    // event_type = unknown AND visitor_id is blank AND session_id is blank
    
    rows.forEach(row => {
        const isCorrupted = row['event_type'] === 'unknown' && 
                            (!row['visitor_id'] || row['visitor_id'].trim() === '') && 
                            (!row['session_id'] || row['session_id'].trim() === '');
        if (isCorrupted) {
            corruptedRows++;
            if (sampleCorrupted.length < 10) sampleCorrupted.push(row);
        } else {
            validRows++;
            if (sampleValid.length < 10) sampleValid.push(row);
        }
    });

    console.log(`\nTotal Rows: ${rows.length}`);
    console.log(`Valid Rows: ${validRows}`);
    console.log(`Corrupted Rows: ${corruptedRows}`);
    console.log(`Corruption Criteria: event_type = 'unknown' AND visitor_id is blank AND session_id is blank`);
    
    console.log(`\nSample Corrupted Rows (up to 10):`);
    console.log(JSON.stringify(sampleCorrupted, null, 2));

    console.log(`\nSample Valid Rows (up to 10):`);
    console.log(JSON.stringify(sampleValid, null, 2));
}

runPhases().catch(console.error);
