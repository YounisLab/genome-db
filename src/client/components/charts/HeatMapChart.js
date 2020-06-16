import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HeatMapFactory from 'highcharts/modules/heatmap'
import { getExportOptions, ExportButton } from '../../components'
HeatMapFactory(Highcharts)

/*
  props = {
    xAxisCategories: categories for labelling x-axis
    yAxisCategories: categories for labelling y-axis
    yAxisMin:
    yAxisMax:
    yAxisLabel: bool to enable/disable y-axis labels
    tooltipFormatter:
    series: data to be drawn (HighCharts series format)
  }
*/
class HeatMapChart extends React.Component {
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
              type: 'heatmap',
              marginTop: 40,
              marginBottom: 80,
              plotBorderWidth: 1,
              zoomType: 'y',
              height: this.props.series.length < 100 ? 500 : 1500
            },
            series: [
              {
                turboThreshold: 0,
                borderWidth: 1,
                data: this.props.series,
                dataLabels: {
                  enabled: false,
                  color: '#000000'
                }
              }
            ],
            title: {
              text: null
            },
            xAxis: {
              categories: this.props.xAxisCategories,
              labels: {
                style: {
                  fontSize: '15px'
                }
              }
            },
            yAxis: {
              categories: this.props.yAxisCategories,
              title: 'Genes',
              labels: {
                enabled: this.props.yAxisLabel === undefined ? true : this.props.yAxisLabel,
                style: {
                  fontSize: '15px'
                }
              }
            },
            colorAxis: {
              min: this.props.yAxisMin,
              max: this.props.yAxisMax,
              stops: [
                [0, '#0000FF'],
                [0.5, '#FFFFFF'],
                [0.9, '#FF0000']
              ],
              labels: {
                style: {
                  fontSize: '12px'
                }
              }
            },
            legend: {
              align: 'right',
              layout: 'vertical',
              margin: 0,
              verticalAlign: 'top',
              y: 25,
              symbolHeight: 280
            },
            tooltip: {
              formatter: this.props.tooltipFormatter
            }
          }}
        />
        <ExportButton getChartRef={this.getChartRef} />
      </div>
    )
  }
}

export { HeatMapChart }
