import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
require('highcharts/modules/heatmap')(Highcharts)
const _ = require('lodash')

const samples = ['mcf10a', 'mcf7']

// data should look like [[0,0, 1.2], [0,1, 2.3] ...]
// quartile should be a float: eg 0.25 implies
// drop bottom 25% and top 25% of all values.
// Returns min and max after dropping
function getQuartiles (data, quartile) {
  var sortedData = _.orderBy(data, function (datum) {
    return datum[2]
  })

  var numToDrop = Math.floor(sortedData.length * quartile)
  var dropped = _.dropRight(
    _.drop(sortedData, numToDrop),
    numToDrop
  )

  return {
    min: _.first(dropped)[2],
    max: _.last(dropped)[2]
  }
}

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

const QUARTILE_FLOAT = 0.25

class HeatMapChart extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      yAxisCategories: [],
      xAxisCategories: samples,
      data: [],
      min: 0,
      max: 0
    }
  }

  componentDidUpdate (prevProps) {
    if (this.props.data && this.props.data.length > 0 &&
        this.props.data !== prevProps.data) {
      var data = createHeatMapSeries(this.props.data, this.state.xAxisCategories)
      var range = getQuartiles(data, QUARTILE_FLOAT)
      var yAxisCategories = _.map(this.props.data, (d) => d.gene)
      this.setState({
        data: data,
        yAxisCategories: yAxisCategories,
        min: range.min,
        max: range.max
      })
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
              plotBorderWidth: 1,
              zoomType: 'y',
              height: this.state.data.length < 100 ? 500 : 1500
            },
            series: [{
              turboThreshold: 0,
              borderWidth: 1,
              data: this.state.data,
              dataLabels: {
                enabled: false,
                color: '#000000'
              }
            }],
            title: {
              text: null
            },
            xAxis: {
              categories: this.state.xAxisCategories,
              labels: {
                style: {
                  fontSize: '15px'
                }
              }
            },
            yAxis: {
              categories: this.state.yAxisCategories,
              title: 'Genes',
              labels: {
                style: {
                  fontSize: '15px'
                }
              }
            },
            colorAxis: {
              min: this.state.min,
              max: this.state.max,
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
              formatter: function () {
                return `Log2 FPKM for <b>${this.series.yAxis.categories[this.point.y]}</b>
                  in <b>${this.series.xAxis.categories[this.point.x]}</b>: <b>${this.point.value}</b>`
              }
            }
          }}
        />
      </div>
    )
  }
}

export default HeatMapChart