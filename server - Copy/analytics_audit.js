const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const sheetsService = require('./services/googleSheetsService');

async function runAudit() {
    const s = await sheetsService.sheets();

    console.log("=== PHASE 2.5: Deep Validation Audit ===");
    
    // Fetch all rows
    const response = await s.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Raw Events!A1:Z'
    });
    const values = response.data.values || [];
    if (values.length === 0) {
        console.log("No data found.");
        return;
    }
    
    // Original rows count (excluding header)
    const originalRowsCount = values.length - 1;
    console.log(`Total Rows in Raw Events: ${originalRowsCount}`);

    const normalizeKey = (key) => {
        if (key === undefined || key === null) return '';
        return String(key).trim().toLowerCase().replace(/\s+/g, '_');
    };
    const headers = values[0].map(h => normalizeKey(h));
    
    const rows = values.slice(1).map(row => {
        const result = {};
        headers.forEach((header, index) => {
            result[header] = row[index] !== undefined ? row[index] : '';
        });
        return result;
    });

    const visitors = {};
    const sessions = {};
    const eventCounts = {};
    let firstTimestamp = null;
    let lastTimestamp = null;

    rows.forEach(row => {
        const vid = row['visitor_id'] || 'BLANK';
        const sid = row['session_id'] || 'BLANK';
        const evt = row['event_type'] || 'BLANK';
        const ts = row['timestamp'];

        if (ts) {
            const time = new Date(ts).getTime();
            if (!isNaN(time)) {
                if (!firstTimestamp || time < firstTimestamp.time) firstTimestamp = { time, str: ts };
                if (!lastTimestamp || time > lastTimestamp.time) lastTimestamp = { time, str: ts };
            }
        }

        visitors[vid] = (visitors[vid] || 0) + 1;
        sessions[sid] = (sessions[sid] || 0) + 1;
        eventCounts[evt] = (eventCounts[evt] || 0) + 1;
    });

    console.log("\n--- 1. Visitor Audit ---");
    const uniqueVisitors = Object.keys(visitors).filter(k => k !== 'BLANK');
    console.log(`Total unique visitor_ids: ${uniqueVisitors.length}`);
    const topVisitors = Object.entries(visitors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
    console.log(`Top 20 visitor_ids by event count:`);
    console.log(topVisitors);

    console.log("\n--- Session Audit ---");
    const uniqueSessions = Object.keys(sessions).filter(k => k !== 'BLANK');
    console.log(`Total unique session_ids: ${uniqueSessions.length}`);
    const topSessions = Object.entries(sessions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
    console.log(`Top 20 session_ids by event count:`);
    console.log(topSessions);

    console.log("\n--- 2. Event Audit ---");
    console.log("Count of every event_type:");
    console.log(eventCounts);
    console.log(`First timestamp: ${firstTimestamp ? firstTimestamp.str : 'None'}`);
    console.log(`Last timestamp: ${lastTimestamp ? lastTimestamp.str : 'None'}`);

    console.log("\n--- 3. Historical Data Audit ---");
    const validRows = rows.filter(row => {
        return !(row['event_type'] === 'unknown' && (!row['visitor_id'] || row['visitor_id'].trim() === '') && (!row['session_id'] || row['session_id'].trim() === ''));
    });
    
    console.log(`Total Valid Rows: ${validRows.length}`);
    
    // Sort valid rows by timestamp ascending to get the oldest
    validRows.sort((a, b) => {
        const ta = new Date(a['timestamp']).getTime();
        const tb = new Date(b['timestamp']).getTime();
        return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
    });

    console.log(`\nOldest 10 valid records:`);
    console.log(JSON.stringify(validRows.slice(0, 10), null, 2));

    console.log("\n=== PHASE 3: Backup Execution ===");
    
    const now = new Date();
    // Format: YYYY-MM-DD HH:mm
    const dateStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const backupTitle = `Raw Events Backup ${dateStr} ${timeStr}`;
    
    try {
        console.log(`Creating backup sheet: ${backupTitle}`);
        // Create new sheet
        const addSheetResponse = await s.spreadsheets.batchUpdate({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            requestBody: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: backupTitle
                        }
                    }
                }]
            }
        });
        
        const newSheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;
        
        // Copy data to new sheet
        await s.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: `${backupTitle}!A1:Z`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: values
            }
        });
        
        // Verify backup
        const verifyResponse = await s.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: `${backupTitle}!A1:A`
        });
        
        const backupRowsCount = (verifyResponse.data.values || []).length - 1;
        console.log(`\nBackup Verification:`);
        console.log(`Original Rows: ${originalRowsCount}`);
        console.log(`Backup Rows: ${backupRowsCount}`);
        if (originalRowsCount === backupRowsCount) {
            console.log("✅ Backup row count exactly matches original row count.");
        } else {
            console.log("❌ Backup row count MISMATCH!");
        }
    } catch (err) {
        console.error("Backup failed:", err.message);
    }
}

runAudit().catch(console.error);
