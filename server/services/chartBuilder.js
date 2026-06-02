module.exports = {
  buildLineChart(sheetId, title, domainRange, seriesRanges, anchorRow, anchorCol, width = 600, height = 350) {
    return {
      addChart: {
        chart: {
          spec: {
            title,
            basicChart: {
              chartType: 'LINE',
              legendPosition: 'BOTTOM_LEGEND',
              axis: [
                { position: 'BOTTOM_AXIS', title: 'Date' },
                { position: 'LEFT_AXIS', title: 'Value' }
              ],
              domains: [{ domain: { sourceRange: { sources: [domainRange] } } }],
              series: seriesRanges.map(s => ({
                series: { sourceRange: { sources: [s] } },
                targetAxis: 'LEFT_AXIS'
              }))
            }
          },
          position: {
            overlayPosition: {
              anchorCell: { sheetId, rowIndex: anchorRow, columnIndex: anchorCol },
              widthPixels: width,
              heightPixels: height
            }
          }
        }
      }
    };
  },
  
  buildPieChart(sheetId, title, domainRange, dataRange, anchorRow, anchorCol, width = 500, height = 350) {
    return {
      addChart: {
        chart: {
          spec: {
            title,
            pieChart: {
              legendPosition: 'RIGHT_LEGEND',
              domain: { sourceRange: { sources: [domainRange] } },
              series: { sourceRange: { sources: [dataRange] } },
              threeDimensional: true
            }
          },
          position: {
            overlayPosition: {
              anchorCell: { sheetId, rowIndex: anchorRow, columnIndex: anchorCol },
              widthPixels: width,
              heightPixels: height
            }
          }
        }
      }
    };
  },
  
  buildColumnChart(sheetId, title, domainRange, seriesRanges, anchorRow, anchorCol, width = 600, height = 350) {
    return {
      addChart: {
        chart: {
          spec: {
            title,
            basicChart: {
              chartType: 'COLUMN',
              legendPosition: 'BOTTOM_LEGEND',
              axis: [
                { position: 'BOTTOM_AXIS', title: 'Category' },
                { position: 'LEFT_AXIS', title: 'Count / Value' }
              ],
              domains: [{ domain: { sourceRange: { sources: [domainRange] } } }],
              series: seriesRanges.map(s => ({
                series: { sourceRange: { sources: [s] } },
                targetAxis: 'LEFT_AXIS'
              }))
            }
          },
          position: {
            overlayPosition: {
              anchorCell: { sheetId, rowIndex: anchorRow, columnIndex: anchorCol },
              widthPixels: width,
              heightPixels: height
            }
          }
        }
      }
    };
  },

  createRange(sheetId, startRow, endRow, startCol, endCol) {
    return {
      sheetId,
      startRowIndex: startRow,
      endRowIndex: endRow,
      startColumnIndex: startCol,
      endColumnIndex: endCol
    };
  }
};
