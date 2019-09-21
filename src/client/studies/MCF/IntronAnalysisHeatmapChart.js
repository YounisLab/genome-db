import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
require('highcharts/modules/heatmap')(Highcharts)
const _ = require('lodash')

const samples = ['mcf7', 'mcf10a']

function createHeatMapSeries (data, samples) {
  var series = []
  _.each(samples, function (sample, yIndex) {
    _.each(data, function (datum, xIndex) {
      // Heatmap data schema [x-index, y-index, gradient value]
      series.push([
        xIndex,
        yIndex,
        datum[`${sample}_log2_psi`]
      ])
    })
  })
  return series
}

class IntronAnalysisHeatmapChart extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      yAxisCategories: samples,
      xAxisCategories: [],
      data: [],
      min_psi: 0,
      max_psi: 0
    }
  }

  componentDidUpdate (prevProps) {
    if (this.props.data && this.props.data.length > 0 &&
        this.props.data !== prevProps.data) {
      var data = createHeatMapSeries(this.props.data, this.state.yAxisCategories)
      var xAxisCategories = _.map(this.props.data, (d) => d.intron_number)
      // Extract psi values to get max and min
      var psiVals = _.flatMap(data, (d) => [d.mcf10a_log2_psi, d.mcf7_log2_psi])
      this.setState({
        data: data,
        xAxisCategories: xAxisCategories,
        min_psi: _.min(psiVals),
        max_psi: _.max(psiVals)
      })
    }
  }

  render () {
    return (
      <div>
        <HighchartsReact
          highcharts={Highcharts}
          options={{
            title: {
              text: null
            },
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
                enabled: false,
                color: '#000000'
              }
            }],
            xAxis: {
              categories: this.state.xAxisCategories,
              title: {
                text: 'Intron Number',
                style: {
                  fontSize: '15px'
                }
              },
              labels: {
                style: {
                  fontSize: '15px'
                }
              }
            },
            yAxis: {
              categories: this.state.yAxisCategories,
              title: {
                text: null
              },
              labels: {
                style: {
                  fontSize: '15px'
                }
              }
            },
            colorAxis: {
              min: this.min_psi,
              max: this.max_psi,
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
                return `Psi value for <b>${this.series.yAxis.categories[this.point.y]}</b>
                  in intron <b>${this.series.xAxis.categories[this.point.x]}</b>: <b>${this.point.value}</b>`
              }
            }
          }}
        />
      </div>
    )
  }
}

export default IntronAnalysisHeatmapChart
