import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
const axios = require('axios')
const _ = require('lodash')

const colorMaps = {
  curve: {
    tcga: '#77a1e5',
    tcga_rbp: 'green',
    tcga_u12: '#f28f43'
  },
  histogram: {
    tcga: '#77a1e5',
    tcga_rbp: 'green',
    tcga_u12: '#f28f43'
  },
  vertical: {
    tcga: '#77a1e5',
    tcga_rbp: 'green',
    tcga_u12: '#f28f43'
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

    this.plotLines = {
      main: false,
      rbp: false,
      u12: false
    }
  }

  componentDidUpdate (prevProps) {
    if (this.props.vertical && this.props.vertical.length > 0 &&
       this.props.vertical !== prevProps.vertical) {
      var vertical = this.props.vertical[0]

      var newSeries = this.state.series
      var plotLines = this.plotLines

      // Remove previous plotLines if they exist
      _.each(plotLines, function (value) {
        if (value) {
          _.each(this.props.samples, () => newSeries.pop())
        }
      })

      // always append verticals to the end of the series
      var v = createVerticalSeries(
        `${vertical.gene} median`,
        [[vertical.median_log2_norm_count_plus_1 || 0, vertical.tcga_height], [vertical.median_log2_norm_count_plus_1 || 0, 0]],
        colorMaps.vertical['tcga']
      )
      newSeries.push(v)

      // create rbp counterparts if they exist
      if (vertical.rbp) {
        var vRBP = createVerticalSeries(
          `${vertical.gene} median_rbp`,
          [[vertical.median_log2_norm_count_plus_1 || 0, vertical.tcga_rbp_height], [vertical.median_log2_norm_count_plus_1 || 0, 0]],
          colorMaps.vertical['tcga_rbp']
        )
        newSeries.push(vRBP)
      }

      // create u12 counterparts if they exist
      if (vertical.u12) {
        var vU12 = createVerticalSeries(
          `${vertical.gene} median_u12`,
          [[vertical.median_log2_norm_count_plus_1 || 0, vertical.tcga_u12_height], [vertical.median_log2_norm_count_plus_1 || 0, 0]],
          colorMaps.vertical['tcga_u12']
        )
        newSeries.push(vU12)
      }

      // set flags to indicate if plotlines exist
      _.each(_.keys(plotLines), function (plot) {
        if (plot == 'main') {
          plotLines[plot] = true
        }
        else {
          plotLines[plot] = vertical[plot] || false
        }
      })
      this.plotLines = plotLines
      this.setState({ series: newSeries })
    }
  }

  componentDidMount () {
    var series = []
    axios.get('api/bellcurve',
      { params: {
          study: 'tcga',
          sample: this.props.samples,
          subsets: ['rbp', 'u12'],
          type: 'median'
        }})
      .then((response) => {
        const medianVals = {}
        // full dataset graph
        var sample = response.config.params.sample
        var curve = createCurveSeries(sample, response.data[0].curve, colorMaps.curve[sample])
        var hgram = createHistogramSeries(sample, response.data[0].hgram, colorMaps.histogram[sample])
        series.push(curve, hgram)

        // rbp graph
        var sampleRBP = sample + '_rbp'
        var curveRBP = createCurveSeries(sampleRBP, response.data[1].curve, colorMaps.curve[sampleRBP])
        var hgramRBP = createHistogramSeries(sampleRBP, response.data[1].hgram, colorMaps.histogram[sampleRBP])
        series.push(curveRBP, hgramRBP)

        // u12 graph
        var sampleU12 = sample + '_u12'
        var curveU12 = createCurveSeries(sampleU12, response.data[2].curve, colorMaps.curve[sampleU12])
        var hgramU12 = createHistogramSeries(sampleU12, response.data[2].hgram, colorMaps.histogram[sampleU12])
        series.push(curveU12, hgramU12)

        // set median
        medianVals[sample] = response.data[0].median
        medianVals[sample + '_rbp'] = response.data[1].median
        medianVals[sample + '_u12'] = response.data[2].median

        this.setState({ series: series })
        // Pass median value to parent
        this.props.setMedianVals(medianVals)
      })
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
                text: 'Log2 Median',
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

export default BellCurveChart
