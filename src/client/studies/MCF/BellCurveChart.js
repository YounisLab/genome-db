import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

const axios = require('axios')
const _ = require('lodash')

const colorMaps = {
  curve: {
    mcf10a: 'blue',
    mcf7: 'red'
  },
  histogram: {
    mcf10a: 'blue',
    mcf7: 'red'
  },
  vertical: {
    mcf10a: 'blue',
    mcf7: 'red'
  }
}

function createCurveSeries (sample, data, color) {
  return {
    name: `${sample} distribution`,
    type: 'line',
    data: data,
    color: color,
    marker: {
      enabled: false
    }
  }
}

function createHistogramSeries (sample, data, color) {
  return {
    name: `${sample} histogram`,
    type: 'column',
    data: data,
    color: color,
    visible: false
  }
}

function createVerticalSeries (sample, data, color) {
  return {
    name: `${sample}`,
    type: 'line',
    data: data,
    color: color,
    pointWidth: 5,
    dashStyle: 'Dash'
  }
}

class BellCurveChart extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      series: []
    }

    this.plotLines = false
  }

  componentDidUpdate (prevProps) {
    if (this.props.vertical && this.props.vertical.length > 0 &&
       this.props.vertical !== prevProps.vertical) {
      var vertical = this.props.vertical[0]

      var newSeries = this.state.series
      // Remove previous plotLines if they exist
      if (this.plotLines) {
        _.each(this.props.samples, () => newSeries.pop())
      }

      // always append verticals to the end of the series
      var v1 = createVerticalSeries(
        `${vertical.gene} fpkm in mcf10a`,
        // Set to 0 when log2 values are infinity
        [[vertical.mcf10a_log2 || 0, vertical.mcf10a_height], [vertical.mcf10a_log2 || 0, 0]],
        colorMaps.vertical['mcf10a']
      )
      var v2 = createVerticalSeries(
        `${vertical.gene} fpkm in mcf7`,
        [[vertical.mcf7_log2 || 0, vertical.mcf7_height], [vertical.mcf7_log2 || 0, 0]],
        colorMaps.vertical['mcf7']
      )
      newSeries.push(v1, v2)

      this.plotLines = true
      this.setState({ series: newSeries })
    }
  }

  componentDidMount () {
    var requests = _.map(this.props.samples, function (sample) {
      return axios.get('/api/bellcurve',
      { params: {
          study: 'mcf',
          sample: sample,
          subsets: [],
          type: 'fpkm'
        }})
    })

    var series = []
    axios.all(requests)
      .then(axios.spread((...responses) => {
        _.each(responses, (r) => {
          var sample = r.config.params.sample
          var curve = createCurveSeries(sample, r.data.curve, colorMaps.curve[sample])
          var hgram = createHistogramSeries(sample, r.data.hgram, colorMaps.histogram[sample])
          series.push(curve, hgram)
        })

        this.setState({ series: series })
      }))
      // TODO .catch block
  }

  render () {
    return (
      <div>
        <HighchartsReact
          highcharts={Highcharts}
          options={{
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
            xAxis: [{
              title: {
                text: 'Log2 FPKM',
                style: {
                  fontSize: '15px'
                }
              },
              labels: {
                style: {
                  fontSize: '15px'
                }
              }
            }],
            yAxis: [{
              title: {
                text: 'Frequency',
                style: {
                  fontSize: '15px'
                }
              },
              labels: {
                style: {
                  fontSize: '15px'
                }
              }
            }],
            series: this.state.series,
            title: '' // No title needed, overrides default
          }}
        />
      </div>
    )
  }
}

export default BellCurveChart
