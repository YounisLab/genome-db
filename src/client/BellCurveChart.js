import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

const axios = require('axios')
const _ = require('lodash')

const colorMaps = {
  mcf10a: 'blue',
  mcf7: 'green'
}

function createCurveSeries (sample, data, color) {
  return {
    name: `${sample} curve`,
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
    color: color
  }
}

class BellCurveChart extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      series: []
    }
  }
  componentDidUpdate (prevProps) {
    if (this.props.vertical && this.props.vertical.length > 0 &&
       this.props.vertical !== prevProps.vertical) {
      // Insert vertical into dataProvider
      console.log('veritcal:', this.props.vertical)
    }
  }
  componentDidMount () {
    var requests = _.map(this.props.samples, function (sample) {
      return axios.get('/api/bellcurve', { params: { sample: sample } })
    })

    var series = []
    axios.all(requests)
      .then(axios.spread((...responses) => {
        _.each(responses, (r) => {
          var sample = r.config.params.sample
          var curve = createCurveSeries(sample, r.data.curve, colorMaps[sample])
          var hgram = createHistogramSeries(sample, r.data.hgram, colorMaps[sample])
          series.push(curve, hgram)
        })

        this.setState({ series: series })
      }))
      // TODO .catch block
  }
  render () {
    console.log(this.state.series)
    return (
      <div>
        <HighchartsReact
          highcharts={Highcharts}
          options={{
            chart: {
              zoomType: 'x'
            },
            xAxis: [{
              title: {
                text: 'Log2 FPKM'
              }
            }],
            yAxis: [{
              title: {
                text: 'Frequency'
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
