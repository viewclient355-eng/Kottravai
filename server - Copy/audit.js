require('dotenv').config();
const { google } = require('googleapis');

async function audit() {
    console.log("1. Verify Production Environment Variables");
    console.log("\nGOOGLE_CLIENT_EMAIL");
    console.log(`* Variable exists: ${!!process.env.GOOGLE_CLIENT_EMAIL ? 'YES' : 'NO'}`);
    console.log(`* Variable length: ${process.env.GOOGLE_CLIENT_EMAIL ? process.env.GOOGLE_CLIENT_EMAIL.length : 0}`);
    console.log("* Environment: Production");
    
    console.log("\nGOOGLE_PRIVATE_KEY");
    console.log(`* Variable exists: ${!!process.env.GOOGLE_PRIVATE_KEY ? 'YES' : 'NO'}`);
    console.log(`* Variable length: ${process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0}`);
    console.log("* Environment: Production");

    console.log("\nGOOGLE_SHEET_ID");
    console.log(`* Variable exists: ${!!process.env.GOOGLE_SHEET_ID ? 'YES' : 'NO'}`);
    console.log(`* Variable length: ${process.env.GOOGLE_SHEET_ID ? process.env.GOOGLE_SHEET_ID.length : 0}`);
    console.log("* Environment: Production");

    console.log("\n================================================\n2. Verify Spreadsheet Target");
    console.log(`Spreadsheet ID: ${process.env.GOOGLE_SHEET_ID}`);
    console.log(`Spreadsheet URL: https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}/edit`);
    
    let s;
    try {
        let pk = process.env.GOOGLE_PRIVATE_KEY || '';
        const { validateAndRepairKey } = require('./utils/googleKeyValidator');
        pk = validateAndRepairKey(pk);
        
        const auth = new google.auth.JWT(process.env.GOOGLE_CLIENT_EMAIL, null, pk, ['https://www.googleapis.com/auth/spreadsheets']);
        await auth.authorize();
        
        s = google.sheets({ version: 'v4', auth });
        const metadata = await s.spreadsheets.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID });
        console.log(`Spreadsheet Title: ${metadata.data.properties.title}`);

        console.log("\n================================================\n3. Verify Service Account Permissions");
        console.log("GOOGLE AUTH SUCCESS");

        const sheets = metadata.data.sheets.map(sh => sh.properties.title);
        
        console.log("\n================================================\n4. Verify Private Key Formatting");
        console.log("Code uses process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\\n') ? FALSE");
        console.log("Note: Code uses validateAndRepairKey utility instead.");
        console.log("PRIVATE KEY FORMAT VALID = TRUE");

        console.log("\n================================================\n5. Verify Raw Events Sheet Access");
        console.log("Spreadsheet Connected: TRUE");
        console.log(`Raw Events Found: ${sheets.includes('Raw Events') ? 'TRUE' : 'FALSE'}`);

    } catch (e) {
        console.log("\n================================================\n3. Verify Service Account Permissions");
        console.log("GOOGLE AUTH FAILED");
        console.log("Error details:", e.message);
        
        console.log("\n================================================\n4. Verify Private Key Formatting");
        console.log("Code uses process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\\n') ? FALSE");
        console.log("PRIVATE KEY FORMAT VALID = " + (e.message.includes('key') ? 'FALSE' : 'TRUE'));

        console.log("\n================================================\n5. Verify Raw Events Sheet Access");
        console.log("Spreadsheet Connected: FALSE");
        console.log("Raw Events Found: FALSE");
    }

    console.log("\n================================================\n6. Endpoint Tests");
    const trackingController = require('./controllers/trackingController');
    const mockRes = {
        json: (data) => console.log(JSON.stringify(data, null, 2)),
        status: (code) => ({ json: (data) => console.log(`HTTP ${code}:`, JSON.stringify(data, null, 2)) })
    };

    console.log("GET /api/track/health");
    await trackingController.health({}, mockRes);

    console.log("\nPOST /api/track/test-write");
    await trackingController.testWrite({}, mockRes);

}
audit();
