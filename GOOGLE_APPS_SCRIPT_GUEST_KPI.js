/**
 * ================================================================
 *  KOTTRAVAI ANALYTICS — GUEST CHECKOUT KPI EXTENSION
 *  Appends Guest KPIs and Funnel Analytics to the existing Dashboard.
 * ================================================================
 * 
 * Instructions:
 * Merge these functions into GOOGLE_APPS_SCRIPT.js
 */

function rebuildGuestKPIDashboard(ss) {
    var V2_SHEET = 'MASTER_EVENT_LOG_V2';
    var sheetName = 'DASHBOARD_SUMMARY';
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    // Row 8: Guest Checkout & OTP KPIs Header
    sheet.getRange(8, 1, 1, 7).merge()
        .setValue('GUEST CHECKOUT & WHATSAPP OTP PERFORMANCE')
        .setFontWeight('bold').setFontSize(12).setFontFamily('Google Sans')
        .setBackground('#1e293b').setFontColor('#f8fafc')
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
    
    // Row 9: Labels
    var kpiLabels = [
        'Guest Visitors', 'Guest Orders', 'Guest Revenue', 
        'OTP Sent', 'OTP Verified', 'OTP Success Rate', 'Checkout Conv. Rate'
    ];
    sheet.getRange(9, 1, 1, 7).setValues([kpiLabels])
        .setFontWeight('bold').setFontSize(9).setBackground('#f1f5f9').setHorizontalAlignment('center');

    // Row 10: Formulas querying V2_SHEET
    // Guest Visitors (Unique Session IDs where event = guest_checkout_started)
    sheet.getRange(10, 1).setFormula('=IFERROR(COUNTUNIQUEIFS(' + V2_SHEET + '!C:C, ' + V2_SHEET + '!M:M, "guest_checkout_started"), 0)');
    
    // Guest Orders (Count of guest_order_created)
    sheet.getRange(10, 2).setFormula('=IFERROR(COUNTIF(' + V2_SHEET + '!M:M, "guest_order_created"), 0)');
    
    // Guest Revenue (Sum conversion_value for guest_order_completed)
    sheet.getRange(10, 3).setFormula('=IFERROR(SUMIFS(' + V2_SHEET + '!U:U, ' + V2_SHEET + '!M:M, "guest_order_completed"), 0)');
    
    // OTP Sent
    sheet.getRange(10, 4).setFormula('=IFERROR(COUNTIF(' + V2_SHEET + '!M:M, "otp_sent"), 0)');
    
    // OTP Verified
    sheet.getRange(10, 5).setFormula('=IFERROR(COUNTIF(' + V2_SHEET + '!M:M, "otp_verified"), 0)');
    
    // OTP Success Rate (Verified / Sent)
    sheet.getRange(10, 6).setFormula('=IFERROR(E10/D10, 0)');
    sheet.getRange(10, 6).setNumberFormat('0.00%');
    
    // Checkout Conversion Rate (Orders / Checkout Started)
    sheet.getRange(10, 7).setFormula('=IFERROR(B10/A10, 0)');
    sheet.getRange(10, 7).setNumberFormat('0.00%');

    // Style Numeric Row
    sheet.getRange(10, 1, 1, 7)
        .setFontWeight('bold').setFontSize(14).setFontFamily('Google Sans')
        .setHorizontalAlignment('center').setVerticalAlignment('middle');

    SpreadsheetApp.flush();
}

/**
 * Builds the Conversion Funnel Sheet
 */
function rebuildConversionFunnel(ss) {
    var V2_SHEET = 'MASTER_EVENT_LOG_V2';
    var sheetName = 'CONVERSION_FUNNEL';
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    
    sheet.clear();
    
    var headers = ['Funnel Stage', 'Unique Users', 'Drop-off %'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
         .setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');

    var stages = [
        ['1. Visitors (page_view)', '=IFERROR(COUNTUNIQUEIFS(' + V2_SHEET + '!C:C, ' + V2_SHEET + '!M:M, "page_view"),0)'],
        ['2. Product Views (view_item)', '=IFERROR(COUNTUNIQUEIFS(' + V2_SHEET + '!C:C, ' + V2_SHEET + '!M:M, "view_item"),0)'],
        ['3. Add to Cart (add_to_cart)', '=IFERROR(COUNTUNIQUEIFS(' + V2_SHEET + '!C:C, ' + V2_SHEET + '!M:M, "add_to_cart"),0)'],
        ['4. Checkout Started (guest_checkout_started)', '=IFERROR(COUNTUNIQUEIFS(' + V2_SHEET + '!C:C, ' + V2_SHEET + '!M:M, "guest_checkout_started"),0)'],
        ['5. OTP Sent (otp_sent)', '=IFERROR(COUNTUNIQUEIFS(' + V2_SHEET + '!C:C, ' + V2_SHEET + '!M:M, "otp_sent"),0)'],
        ['6. OTP Verified (otp_verified)', '=IFERROR(COUNTUNIQUEIFS(' + V2_SHEET + '!C:C, ' + V2_SHEET + '!M:M, "otp_verified"),0)'],
        ['7. Purchase Completed (guest_order_completed)', '=IFERROR(COUNTUNIQUEIFS(' + V2_SHEET + '!C:C, ' + V2_SHEET + '!M:M, "guest_order_completed"),0)']
    ];

    for (var i = 0; i < stages.length; i++) {
        sheet.getRange(i + 2, 1).setValue(stages[i][0]);
        sheet.getRange(i + 2, 2).setFormula(stages[i][1]);
        if (i === 0) {
            sheet.getRange(i + 2, 3).setValue('-');
        } else {
            // Drop-off from previous stage
            sheet.getRange(i + 2, 3).setFormula('=IFERROR(1 - (B' + (i + 2) + '/B' + (i + 1) + '), 0)');
            sheet.getRange(i + 2, 3).setNumberFormat('0.00%');
        }
    }

    // Insert Funnel Chart
    var chart = sheet.newChart()
        .setChartType(Charts.ChartType.BAR)
        .addRange(sheet.getRange(2, 1, 7, 2))
        .setPosition(10, 1, 0, 0)
        .setOption('title', 'Guest Checkout Conversion Funnel')
        .build();
    sheet.insertChart(chart);
}
