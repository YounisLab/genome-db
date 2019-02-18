import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
require('highcharts/modules/heatmap')(Highcharts)
const _ = require('lodash')

const samples = ['mcf10a', 'mcf7']

function createHeatMapSeries (data, samples) {
  var series = []
  _.each(samples, function (sample, xIndex) {
    _.each(data, function (datum, yIndex) {
      // Heatmap data schema [x-index, y-index, gradient value]
      series.push([
        xIndex,
        yIndex,
        datum[`${sample}_log2`]
      ])
    })
  })

  return series
}

class HeatMapChart extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      yAxisCategories: [],
      xAxisCategories: samples,
      data: []
    }
  }
  componentDidUpdate (prevProps) {
    if (this.props.data && this.props.data.length > 0 &&
        this.props.data !== prevProps.data) {
      var data = createHeatMapSeries(this.props.data, this.state.xAxisCategories)
      var yAxisCategories = _.map(this.props.data, (d) => d.gene)
      this.setState({ data: data, yAxisCategories: yAxisCategories })
    }
  }
  render () {
    return (
      <div>
        <HighchartsReact
          highcharts={Highcharts}
          options={{
            chart: {
              type: 'heatmap',
              marginTop: 40,
              marginBottom: 80,
              plotBorderWidth: 1
            },
            series: [{
              borderWidth: 1,
              data: this.state.data,
              dataLabels: {
                enabled: true,
                color: '#000000'
              }
            }],
            title: {
              text: null
            },
            xAxis: {
              categories: this.state.xAxisCategories
            },
            yAxis: {
              categories: this.state.yAxisCategories,
              title: 'Genes'
            },
            colorAxis: {
              min: 0,
              minColor: '#FFFFFF',
              maxColor: Highcharts.getOptions().colors[0]
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
              formatter: function () {
                return '<b>' + this.series.xAxis.categories[this.point.x] + '</b> sold <br><b>' +
                    this.point.value + '</b> items on <br><b>' + this.series.yAxis.categories[this.point.y] + '</b>'
              }
            }
          }}
        />
      </div>
    )
  }
}

export default HeatMapChart
