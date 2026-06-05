const generateEmailHtml = (data) => {
  const b = data.blocks;
  
  // Theme Variables
  const primary = '#5C3B1E';
  const secondary = '#8B5E34';
  const accent = '#D4A373';
  const bg = '#FFFDF8';

  const Card = (title, value) => `
    <td style="width: 50%; padding: 10px; border-bottom: 1px solid #EEE;">
      <div style="font-size: 12px; color: ${secondary}; text-transform: uppercase;">${title}</div>
      <div style="font-size: 18px; font-weight: bold; color: ${primary}; margin-top: 4px;">${value}</div>
    </td>
  `;

  const SectionHeader = (num, title) => `
    <tr>
      <td style="padding: 20px 0 10px 0;">
        <h2 style="font-size: 16px; color: ${primary}; margin: 0; border-bottom: 2px solid ${accent}; padding-bottom: 5px;">
          <span style="color: ${accent}; margin-right: 5px;">${num}.</span> ${title}
        </h2>
      </td>
    </tr>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F4F4F4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: \${bg}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .header { background-color: \${primary}; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 500; letter-spacing: 1px; }
        .header p { margin: 10px 0 0 0; color: \${accent}; font-size: 14px; }
        .content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        .footer { background-color: \${secondary}; color: #FFFFFF; text-align: center; padding: 15px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>KOTTRAVAI ANALYTICS</h1>
          <p>Daily Executive Digest • \${data.date}</p>
        </div>
        
        <div class="content">
          <p style="font-size: 14px; color: \${secondary}; line-height: 1.5;">Here is your complete intelligence digest for yesterday's operations. This report exclusively utilizes verified live-site event data.</p>
          
          <table width="100%" cellpadding="0" cellspacing="0">
            <!-- 1. EXECUTIVE MORNING BRIEF -->
            \${SectionHeader('1', 'EXECUTIVE MORNING BRIEF')}
            <tr>
              <td style="background-color: white; border-radius: 8px; border: 1px solid #EAEAEA; padding: 15px;">
                <p style="margin: 0 0 10px 0;"><strong>What Happened:</strong> We processed \${b.orderInsights.totalOrders} orders resulting in \${b.revenueInsights.todayRevenue}.</p>
                <p style="margin: 0 0 10px 0;"><strong>What Needs Attention:</strong> \${b.productInsights.mostCriticalProduct !== 'N/A' ? 'High abandonment on ' + b.productInsights.mostCriticalProduct : 'Metrics remain stable across product lines.'}</p>
                <p style="margin: 0 0 10px 0;"><strong>Biggest Opportunity:</strong> \${b.revenueInsights.revenueOpportunity} in recoverable abandoned cart revenue.</p>
                <p style="margin: 0;"><strong>Recommended Action:</strong> \${b.aiRecommendations.topRecommendedAction}</p>
              </td>
            </tr>

            <!-- 2. VISITOR INSIGHTS -->
            \${SectionHeader('2', 'VISITOR INSIGHTS')}
            <tr>
              <td>
                <table width="100%">
                  <tr>\${Card('Total Visitors', b.visitorInsights.totalVisitors)}\${Card('New Visitors', b.visitorInsights.newVisitors)}</tr>
                  <tr>\${Card('Repeat Visitors', b.visitorInsights.repeatVisitors)}\${Card('Top Traffic Source', b.visitorInsights.topTrafficSource)}</tr>
                  <tr>\${Card('Top Campaign', b.visitorInsights.topCampaign)}<td style="width: 50%"></td></tr>
                </table>
              </td>
            </tr>

            <!-- 3. PRODUCT INSIGHTS -->
            \${SectionHeader('3', 'PRODUCT INSIGHTS')}
            <tr>
              <td>
                <table width="100%">
                  <tr>\${Card('Most Viewed Product', b.productInsights.mostViewedProduct)}\${Card('Most Repeatedly Viewed', b.productInsights.mostRepeatedlyViewedProduct)}</tr>
                  <tr>\${Card('Highest Revenue', b.productInsights.highestRevenueProduct)}\${Card('Highest Conversion', b.productInsights.highestConversionProduct)}</tr>
                  <tr>\${Card('Most Critical', b.productInsights.mostCriticalProduct)}<td style="width: 50%"></td></tr>
                </table>
              </td>
            </tr>

            <!-- 4. CART INTELLIGENCE -->
            \${SectionHeader('4', 'CART INTELLIGENCE')}
            <tr>
              <td>
                <table width="100%">
                  <tr>\${Card('Top Add To Cart', b.cartIntelligence.topAddToCartProduct)}\${Card('Avg Cart Duration', b.cartIntelligence.averageCartDuration)}</tr>
                  <tr>\${Card('Cart Conv Rate', b.cartIntelligence.cartConversionRate)}\${Card('Recoverable Rev', b.cartIntelligence.recoverableRevenue)}</tr>
                  <tr>\${Card('Lost Revenue', b.cartIntelligence.lostRevenue)}<td style="width: 50%"></td></tr>
                </table>
              </td>
            </tr>

            <!-- 5. GEOGRAPHY INSIGHTS -->
            \${SectionHeader('5', 'GEOGRAPHY INSIGHTS')}
            <tr>
              <td>
                <table width="100%">
                  <tr>\${Card('Top State', b.geographyInsights.topState)}\${Card('Top City', b.geographyInsights.topCity)}</tr>
                  <tr>\${Card('New Geo Source', b.geographyInsights.newGeographySources)}\${Card('Returning Geo', b.geographyInsights.returningGeographySources)}</tr>
                </table>
              </td>
            </tr>

            <!-- 6. PAGE PERFORMANCE -->
            \${SectionHeader('6', 'PAGE PERFORMANCE')}
            <tr>
              <td>
                <table width="100%">
                  <tr>\${Card('Top Viewed Page', b.pagePerformance.topViewedPage)}\${Card('Most Revisited', b.pagePerformance.mostRevisitedPage)}</tr>
                  <tr>\${Card('Top Product Page', b.pagePerformance.topProductPage)}<td style="width: 50%"></td></tr>
                </table>
              </td>
            </tr>

            <!-- 7. ORDER INSIGHTS -->
            \${SectionHeader('7', 'ORDER INSIGHTS')}
            <tr>
              <td>
                <table width="100%">
                  <tr>\${Card('Total Orders', b.orderInsights.totalOrders)}\${Card('New Customers', b.orderInsights.newCustomers)}</tr>
                  <tr>\${Card('Returning Customers', b.orderInsights.returningCustomers)}\${Card('Avg Order Value', b.orderInsights.averageOrderValue)}</tr>
                  <tr>\${Card('Conversion Rate', b.orderInsights.conversionRate)}<td style="width: 50%"></td></tr>
                </table>
              </td>
            </tr>

            <!-- 8. REVENUE INSIGHTS -->
            \${SectionHeader('8', 'REVENUE INSIGHTS')}
            <tr>
              <td>
                <table width="100%">
                  <tr>\${Card('Today Revenue', b.revenueInsights.todayRevenue)}\${Card('Last 7 Days', b.revenueInsights.last7DaysRevenue)}</tr>
                  <tr>\${Card('Month To Date', b.revenueInsights.monthToDateRevenue)}\${Card('Recovered Rev', b.revenueInsights.recoveredRevenue)}</tr>
                  <tr>\${Card('Rev Opportunity', b.revenueInsights.revenueOpportunity)}<td style="width: 50%"></td></tr>
                </table>
              </td>
            </tr>

            <!-- 9. CAMPAIGN & ATTRIBUTION -->
            \${SectionHeader('9', 'CAMPAIGN & ATTRIBUTION')}
            <tr>
              <td>
                <table width="100%">
                  <tr>\${Card('Top Campaign', b.campaignAttribution.topCampaign)}\${Card('Top Rev Campaign', b.campaignAttribution.topRevenueCampaign)}</tr>
                  <tr>\${Card('Top First Touch', b.campaignAttribution.topFirstTouchSource)}\${Card('Top Last Touch', b.campaignAttribution.topLastTouchSource)}</tr>
                  <tr>\${Card('Top Rev Journey', b.campaignAttribution.topRevenueJourney)}<td style="width: 50%"></td></tr>
                </table>
              </td>
            </tr>

            <!-- 10. AI BUSINESS RECOMMENDATIONS -->
            \${SectionHeader('10', 'AI RECOMMENDATIONS')}
            <tr>
              <td>
                <table width="100%">
                  <tr>\${Card('Top Promo Product', b.aiRecommendations.topProductToPromote)}\${Card('Highest Opportunity', b.aiRecommendations.highestOpportunityProduct)}</tr>
                  <tr>\${Card('Highest Abandonment', b.aiRecommendations.highestAbandonmentProduct)}\${Card('Best Geo', b.aiRecommendations.bestGeography)}</tr>
                  <tr>\${Card('Best Campaign', b.aiRecommendations.bestCampaign)}<td style="width: 50%"></td></tr>
                </table>
              </td>
            </tr>
          </table>
          <br>
        </div>
        <div class="footer">
          Generated automatically by Kottravai Analytics Engine.<br>
          <i>Powered by Antigravity Intelligence</i>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  generateEmailHtml
};
