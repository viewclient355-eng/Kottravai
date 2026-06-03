const buildDailyAnalyticsEmail = (summary) => {
  const formatNum = (num) => Number(num).toLocaleString('en-IN');
  const formatCur = (num) => '₹' + Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatPct = (num) => Number(num).toFixed(2) + '%';

  // Kottravai Brand Colors
  const primary = '#5C3B1E';
  const secondary = '#8B5E34';
  const accent = '#D4A373';
  const bg = '#FFFDF8';
  const alt = '#F7F3EB';
  const success = '#6B8E23';

  // Format date nicely
  const displayDate = new Date(summary.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Generate Insights
  let insightsHtml = '';
  if (summary.topProduct.name !== 'None') {
    insightsHtml += `<li><strong>${summary.topProduct.name}</strong> was the most viewed product today with ${summary.topProduct.views} views.</li>`;
  }
  if (summary.topTraffic.source !== 'Direct') {
    insightsHtml += `<li><strong>${summary.topTraffic.source}</strong> was your highest traffic source, driving ${summary.topTraffic.count} interactions.</li>`;
  }
  const totalDevice = summary.deviceBreakdown.Mobile + summary.deviceBreakdown.Desktop + summary.deviceBreakdown.Tablet;
  if (totalDevice > 0) {
    const mobilePct = ((summary.deviceBreakdown.Mobile / totalDevice) * 100).toFixed(1);
    insightsHtml += `<li><strong>${mobilePct}%</strong> of your tracked traffic came from mobile devices.</li>`;
  }
  if (summary.orders > 0) {
    insightsHtml += `<li>You received <strong>${summary.orders}</strong> orders, generating <strong>${formatCur(summary.revenue)}</strong> in revenue!</li>`;
  } else {
    insightsHtml += `<li>There were no recorded purchases today. Consider reviewing the conversion funnel.</li>`;
  }

  // Traffic Sources Rows
  let trafficHtml = '';
  Object.entries(summary.trafficSources)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      trafficHtml += `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">${source}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatNum(count)}</td></tr>`;
    });

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; color: #333; }
      .container { max-width: 600px; margin: 0 auto; background-color: ${bg}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
      .header { background-color: ${primary}; color: #ffffff; padding: 30px 20px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
      .header p { margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; }
      .content { padding: 30px 20px; }
      .section-title { color: ${secondary}; font-size: 18px; border-bottom: 2px solid ${accent}; padding-bottom: 5px; margin-top: 0; margin-bottom: 15px; }
      
      .kpi-grid { display: table; width: 100%; border-spacing: 10px; border-collapse: separate; margin-left: -10px; margin-right: -10px; }
      .kpi-row { display: table-row; }
      .kpi-card { display: table-cell; background-color: #ffffff; border: 1px solid ${alt}; border-radius: 6px; padding: 15px; text-align: center; width: 33%; }
      .kpi-card .label { font-size: 11px; text-transform: uppercase; color: #777; letter-spacing: 0.5px; display: block; margin-bottom: 5px; }
      .kpi-card .value { font-size: 20px; font-weight: bold; color: ${primary}; }
      .kpi-card.success .value { color: ${success}; }
      
      .insights-box { background-color: ${alt}; padding: 15px 20px; border-left: 4px solid ${accent}; border-radius: 4px; margin-bottom: 25px; }
      .insights-box ul { margin: 0; padding-left: 20px; }
      .insights-box li { margin-bottom: 8px; font-size: 14px; line-height: 1.5; }
      .insights-box li:last-child { margin-bottom: 0; }
      
      .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; }
      .table th { background-color: ${primary}; color: white; padding: 10px; text-align: left; font-weight: normal; }
      .table td { padding: 10px; border-bottom: 1px solid #eee; }
      .table tr:nth-child(even) { background-color: ${alt}; }
      
      .footer { background-color: #ffffff; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📊 Daily Analytics Report</h1>
        <p>${displayDate}</p>
      </div>
      
      <div class="content">
        <h2 class="section-title">Key Insights</h2>
        <div class="insights-box">
          <ul>
            ${insightsHtml}
          </ul>
        </div>

        <h2 class="section-title">Revenue Summary</h2>
        <div class="kpi-grid">
          <div class="kpi-row">
            <div class="kpi-card success">
              <span class="label">Revenue</span>
              <span class="value">${formatCur(summary.revenue)}</span>
            </div>
            <div class="kpi-card">
              <span class="label">Orders</span>
              <span class="value">${formatNum(summary.orders)}</span>
            </div>
            <div class="kpi-card">
              <span class="label">AOV</span>
              <span class="value">${formatCur(summary.aov)}</span>
            </div>
          </div>
        </div>

        <h2 class="section-title">Traffic Summary</h2>
        <div class="kpi-grid">
          <div class="kpi-row">
            <div class="kpi-card">
              <span class="label">Total Visitors</span>
              <span class="value">${formatNum(summary.visitors)}</span>
            </div>
            <div class="kpi-card">
              <span class="label">Unique Visitors</span>
              <span class="value">${formatNum(summary.uniqueVisitors)}</span>
            </div>
            <div class="kpi-card">
              <span class="label">Sessions</span>
              <span class="value">${formatNum(summary.sessions)}</span>
            </div>
          </div>
        </div>

        <h2 class="section-title">Engagement Metrics</h2>
        <div class="kpi-grid">
          <div class="kpi-row">
            <div class="kpi-card">
              <span class="label">Product Views</span>
              <span class="value">${formatNum(summary.productViews)}</span>
            </div>
            <div class="kpi-card">
              <span class="label">Add To Carts</span>
              <span class="value">${formatNum(summary.addToCarts)}</span>
            </div>
            <div class="kpi-card">
              <span class="label">Conversion</span>
              <span class="value">${formatPct(summary.conversionRate)}</span>
            </div>
          </div>
        </div>

        <h2 class="section-title">Top Performance</h2>
        <table class="table">
          <tr>
            <th>Metric</th>
            <th>Item</th>
            <th style="text-align: right;">Views</th>
          </tr>
          <tr>
            <td><strong>Top Product</strong></td>
            <td>${summary.topProduct.name}</td>
            <td style="text-align: right;">${formatNum(summary.topProduct.views)}</td>
          </tr>
          <tr>
            <td><strong>Top Page</strong></td>
            <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${summary.topPage.url}</td>
            <td style="text-align: right;">${formatNum(summary.topPage.views)}</td>
          </tr>
        </table>

        <h2 class="section-title">Traffic Sources</h2>
        <table class="table">
          <tr>
            <th>Source</th>
            <th style="text-align: right;">Events</th>
          </tr>
          ${trafficHtml || '<tr><td colspan="2" style="text-align:center;">No traffic sources recorded.</td></tr>'}
        </table>
        
        <h2 class="section-title">Device Breakdown</h2>
        <div class="kpi-grid">
          <div class="kpi-row">
            <div class="kpi-card">
              <span class="label">Mobile</span>
              <span class="value">${formatNum(summary.deviceBreakdown.Mobile)}</span>
            </div>
            <div class="kpi-card">
              <span class="label">Desktop</span>
              <span class="value">${formatNum(summary.deviceBreakdown.Desktop)}</span>
            </div>
            <div class="kpi-card">
              <span class="label">Tablet</span>
              <span class="value">${formatNum(summary.deviceBreakdown.Tablet)}</span>
            </div>
          </div>
        </div>

      </div>
      
      <div class="footer">
        Automated Daily Reporting System &bull; Kottravai Analytics<br>
        This email was generated from your Raw Events Google Sheet data.
      </div>
    </div>
  </body>
  </html>
  `;
};

module.exports = {
  buildDailyAnalyticsEmail
};
