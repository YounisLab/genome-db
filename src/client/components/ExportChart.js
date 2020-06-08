import React from 'react'
import Highcharts from 'highcharts'
import { Button } from 'antd'
require('highcharts/modules/exporting')(Highcharts)
require('highcharts/modules/offline-exporting.js')(Highcharts)

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
    chart : referece to highchart component
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
