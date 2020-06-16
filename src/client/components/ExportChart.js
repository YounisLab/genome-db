import React from 'react'
import Highcharts from 'highcharts'
import hcExporting from 'highcharts/modules/exporting'
import hcOfflineExporting from 'highcharts/modules/offline-exporting.js'
import { Button } from 'antd'

/* initialize export modules */
hcExporting(Highcharts)
hcOfflineExporting(Highcharts)

export function getExportOptions(filename) {
  return {
    enabled: false,
    sourceWidth: 1920,
    sourceHeight: 1080,
    scale: 1,
    tableCaption: false,
    fallbackToExportServer: false,
    filename: filename,
    chartOptions: {
      title: false
    }
  }
}

/*
  props = {
    chart : reference to highchart component
  }
*/
class ExportButton extends React.Component {
  chartRef

  exportChart = () => {
    this.chartRef = this.props.getChartRef()
    this.chartRef.exportChartLocal()
  }

  render() {
    return (
      <div>
        <Button type='primary' icon='download' onClick={this.exportChart}>
          Export
        </Button>
      </div>
    )
  }
}

export { ExportButton }
