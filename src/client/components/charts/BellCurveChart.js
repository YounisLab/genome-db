import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { getExportOptions, ExportButton } from '../../components'

/*
  props = {
    xLabel: label for xAxis
    yLabel: label for yAxis
    series: data to be drawn (HighCharts series format)
  }
*/
class BellCurveChart extends React.Component {
  constructor(props) {
    super(props)
    this.exportOptions = getExportOptions(this.props.filename)
  }

  getChartRef = () => {
    return this.refs.chart.chart
  }

  render() {
    return (
      <div>
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={'chart'}
          ref={'chart'}
          options={{
            exporting: this.exportOptions,
            chart: {
              zoomType: 'x'
            },
            legend: {
              align: 'right',
              verticalAlign: 'top',
              layout: 'vertical',
              itemMarginTop: 5,
              itemMarginBottom: 5,
              itemStyle: {
                fontSize: '15px'
              }
            },
            xAxis: [
              {
                title: {
                  text: this.props.xLabel,
                  style: {
                    fontSize: '15px'
                  }
                },
                labels: {
                  style: {
                    fontSize: '15px'
                  }
                }
              }
            ],
            yAxis: [
              {
                title: {
                  text: this.props.yLabel,
                  style: {
                    fontSize: '15px'
                  }
                },
                labels: {
                  style: {
                    fontSize: '15px'
                  }
                }
              }
            ],
            series: this.props.series,
            title: '' // No title needed, overrides default
          }}
        />
        <ExportButton getChartRef={this.getChartRef} />
      </div>
    )
  }
}

export { BellCurveChart }
