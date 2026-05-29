/**
 * Google Apps Script helper to refresh the analytics dashboard.
 *
 * To use:
 * 1. Open Apps Script attached to your Google Sheets file.
 * 2. Replace SPREADSHEET_ID with your actual spreadsheet id.
 * 3. Run setupDashboardHourlyTrigger() once to install the hourly trigger.
 */

const SPREADSHEET_ID = 'REPLACE_WITH_YOUR_SPREADSHEET_ID';
const RAW_EVENTS_SHEET_NAME = 'Raw Events';
const LEGACY_ANALYTICS_SHEET_NAME = 'Analytics';
const DASHBOARD_SHEET_NAME = 'Dashboard';

function getSourceSheetName(ss) {
  let sheet = ss.getSheetByName(RAW_EVENTS_SHEET_NAME);
  if (sheet) return RAW_EVENTS_SHEET_NAME;
  sheet = ss.getSheetByName(LEGACY_ANALYTICS_SHEET_NAME);
  return sheet ? LEGACY_ANALYTICS_SHEET_NAME : RAW_EVENTS_SHEET_NAME;
}

function updateDashboardSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sourceSheetName = getSourceSheetName(ss);
  let dashboardSheet = ss.getSheetByName(DASHBOARD_SHEET_NAME);
  if (!dashboardSheet) {
    dashboardSheet = ss.insertSheet(DASHBOARD_SHEET_NAME);
  }

  dashboardSheet.clear();

  const dashboardData = [
    ['Metric', 'Value'],
    ['Total Visitors', `=COUNTA(UNIQUE(FILTER('${sourceSheetName}'!J2:J, '${sourceSheetName}'!J2:J<>"")))`],
    ['New Visitors (30d)', `=COUNTA(UNIQUE(FILTER('${sourceSheetName}'!J2:J, '${sourceSheetName}'!A2:A>=TODAY()-30)))`],
    ['Repeat Visitor Ratio', '=IF(B2=0,0,1 - B2 / B1)'],
    ['Page Views', `=COUNTIF('${sourceSheetName}'!B:B, "page_view")`],
    ['Product Views', `=COUNTIF('${sourceSheetName}'!B:B, "product_view")`],
    ['Add To Cart', `=COUNTIF('${sourceSheetName}'!B:B, "add_to_cart")`],
    ['Checkout Started', `=COUNTIF('${sourceSheetName}'!B:B, "checkout_started")`],
    ['Purchases', `=COUNTIF('${sourceSheetName}'!B:B, "purchase_completed")`],
    ['Cart Conversion', '=IF(B6=0,0,B8 / B6)'],
    ['Purchase Conversion', '=IF(B8=0,0,B9 / B8)']
  ];

  dashboardSheet.getRange(1, 1, dashboardData.length, dashboardData[0].length).setValues(dashboardData);

  dashboardSheet.getRange('D1').setValue('Product Analytics');
  dashboardSheet.getRange('D2:G2').setValues([['Product Name', 'Views', 'Cart Adds', 'Purchases']]);
  dashboardSheet.getRange('D3').setFormula(`=SORT(UNIQUE(FILTER('${sourceSheetName}'!O2:O,'${sourceSheetName}'!O2:O<>"")),1,FALSE)`);
  dashboardSheet.getRange('E3').setFormula(`=ARRAYFORMULA(IF(D3:D="", "", COUNTIFS('${sourceSheetName}'!O:O, D3:D, '${sourceSheetName}'!B:B, "product_view")))`);
  dashboardSheet.getRange('F3').setFormula(`=ARRAYFORMULA(IF(D3:D="", "", COUNTIFS('${sourceSheetName}'!O:O, D3:D, '${sourceSheetName}'!B:B, "add_to_cart")))`);
  dashboardSheet.getRange('G3').setFormula(`=ARRAYFORMULA(IF(D3:D="", "", COUNTIFS('${sourceSheetName}'!O:O, D3:D, '${sourceSheetName}'!B:B, "purchase_completed")))`);

  dashboardSheet.getRange('I1').setValue('Traffic Analytics');
  dashboardSheet.getRange('I2').setValues([['Date', 'Sessions']]);
  dashboardSheet.getRange('I3').setFormula(`=QUERY({ARRAYFORMULA(INT('${sourceSheetName}'!A2:A)),'${sourceSheetName}'!I2:I},"select Col1,count(Col2) where Col2<>\"\" group by Col1 order by Col1 desc limit 14",0)`);

  dashboardSheet.getRange('K1').setValue('Revenue Analytics');
  dashboardSheet.getRange('K2:L5').setValues([
    ['GMV', `=SUMIF('${sourceSheetName}'!B:B,"purchase_completed",'${sourceSheetName}'!T:T)`],
    ['Total Orders', `=COUNTIF('${sourceSheetName}'!B:B,"purchase_completed")`],
    ['Average Order Value', '=IF(L2=0,0,L1 / L2)'],
    ['Avg Time on Product (sec)', `=IFERROR(AVERAGEIF('${sourceSheetName}'!B:B,"time_spent_on_product",'${sourceSheetName}'!V:V),0)`]
  ]);
}

function setupDashboardHourlyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const existing = triggers.some(trigger => trigger.getHandlerFunction() === 'updateDashboardSheet');
  if (!existing) {
    ScriptApp.newTrigger('updateDashboardSheet')
      .timeBased()
      .everyHours(1)
      .create();
  }
}
