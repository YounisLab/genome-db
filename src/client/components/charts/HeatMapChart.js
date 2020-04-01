import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HeatMapFactory from 'highcharts/modules/heatmap'

HeatMapFactory(Highcharts)

/*
  props = {
    xAxisCategories: categories for labelling x-axis
    yAxisCategories: categories for labelling y-axis
    yAxisMin:
    yAxisMax:
    tooltipFormatter:
    series: data to be drawn (HighCharts series format)
  }
*/
class HeatMapChart extends React.Component {
  render() {
    return (
      <div>
        <HighchartsReact
          highcharts={Highcharts}
          options={{
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
      </div>
    )
  }
}

export { HeatMapChart }
