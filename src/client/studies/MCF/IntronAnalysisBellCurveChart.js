import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
const axios = require('axios')
const _ = require('lodash')

const colorMaps = {
  curve: {
    mcf10a: 'blue',
    mcf7: 'red',
    mcf10a_u12: 'purple',
    mcf7_u12: 'green'
  },
  histogram: {
    mcf10a: 'blue',
    mcf7: 'red',
    mcf10a_u12: 'purple',
    mcf7_u12: 'green'
  },
  vertical: {
    mcf10a: 'blue',
    mcf7: 'red',
    mcf10a_u12: 'purple',
    mcf7_u12: 'green'
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

class IntronAnalysisBellCurveChart extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      series: []
    }

    this.plotLines = false
    this.u12PlotLines = false
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
      // Remove again if U12 verticals also included
      if (this.u12PlotLines) {
        _.each(this.props.samples, () => newSeries.pop())
      }

      // always append verticals to the end of the series
      var v1 = createVerticalSeries(
        `${vertical.gene} avg_psi in mcf10a`,
        [[vertical.mcf10a_avg_log2_psi || 0, vertical.mcf10a_height], [vertical.mcf10a_avg_log2_psi || 0, 0]],
        colorMaps.vertical['mcf10a']
      )
      var v2 = createVerticalSeries(
        `${vertical.gene} avg_psi in mcf7`,
        [[vertical.mcf7_avg_log2_psi || 0, vertical.mcf7_height], [vertical.mcf7_avg_log2_psi || 0, 0]],
        colorMaps.vertical['mcf7']
      )
      newSeries.push(v1, v2)

      // create u12 counterparts if they exist
      if (vertical.u12) {
        var v1u12 = createVerticalSeries(
          `${vertical.gene} avg_psi in mcf10a_u12`,
          [[vertical.mcf10a_avg_log2_psi || 0, vertical.mcf10a_u12_height], [vertical.mcf10a_avg_log2_psi || 0, 0]],
          colorMaps.vertical['mcf10a_u12']
        )
        var v2u12 = createVerticalSeries(
          `${vertical.gene} avg_psi in mcf7_u12`,
          [[vertical.mcf7_avg_log2_psi || 0, vertical.mcf7_u12_height], [vertical.mcf7_avg_log2_psi || 0, 0]],
          colorMaps.vertical['mcf7_u12']
        )
        newSeries.push(v1u12, v2u12)
        this.u12PlotLines = true
      }
      this.plotLines = true
      this.setState({ series: newSeries })
    }
  }

  componentDidMount () {
    var props = this.props
    var requests = _.map(props.samples, function (sample) {
      return axios.get('/api/bellcurve',
      { params: {
          study: 'mcf',
          sample: sample,
          subsets: props.subsets,
          type: props.type
        }})
    })

    var series = []
    axios.all(requests)
      .then(axios.spread((...responses) => {
        // key parameter expected by antd
        const medianPsi = {}
        _.each(_.flatten(responses), (r) => {
          // full dataset graph
          var sample = r.config.params.sample
          var curve = createCurveSeries(sample, r.data[0].curve, colorMaps.curve[sample])
          var hgram = createHistogramSeries(sample, r.data[0].hgram, colorMaps.histogram[sample])
          // u12 graph
          var sampleU12 = sample + '_u12'
          var curveU12 = createCurveSeries(sampleU12, r.data[1].curve, colorMaps.curve[sampleU12])
          var hgramU12 = createHistogramSeries(sampleU12, r.data[1].hgram, colorMaps.histogram[sampleU12])
          series.push(curve, hgram)
          series.push(curveU12, hgramU12)
          // set median
          medianPsi[sample] = r.data[0].median
          medianPsi[sample + '_u12'] = r.data[0].median
        })

        this.setState({ series: series })
        // Pass median value to parent
        this.props.setMedianPsi(medianPsi)
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
                text: 'Log2 Psi',
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
            title: '' // No title needed, overrides defaultS
          }}
        />
      </div>
    )
  }
}

export default IntronAnalysisBellCurveChart
