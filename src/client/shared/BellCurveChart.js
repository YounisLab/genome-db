import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
const axios = require('axios')
const _ = require('lodash')

/* To use this chart pass in the following through props:
      vertical: the actual data
      samples: the samples being used
      subsets: the subsets being used
      setMedianVals: function for setting median values in BellCurve
      type: type of data
      bcType: type of data displayed on BellCurve
      xLabel: label for xAxis
      yLabel: label for yAxis
      colorMap: color for each expected chart
*/

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
      xLabel: this.props.xLabel,
      yLabel: this.props.yLabel,
      series: []
    }

    this.plotLines = 0
  }

  componentDidUpdate (prevProps) {
    if (this.props.vertical && this.props.vertical.length > 0 &&
       this.props.vertical !== prevProps.vertical) {
      var vertical = this.props.vertical[0]
      var props = this.props
      var newSeries = this.state.series
      var plotLines = 0 // defined to allow edit within lodash functions
      // Remove previous plotLines if they exist
      _.times(this.plotLines, () => newSeries.pop())

      // create verticals for each sample
      _.each(props.samples, function (sample) {
        var vert = createVerticalSeries(
          `${vertical.gene} ${props.type} in ${sample}`,
          // Set to 0 when log2 values are infinity
          [[vertical[`${sample}_${props.bcType}`] || 0, vertical[`${sample}_height`]], [vertical[`${sample}_${props.bcType}`] || 0, 0]],
          props.colorMaps.vertical[sample]
        )
        newSeries.push(vert)
        plotLines++
        // add a vertical for each subset if it exists
        _.each(props.subsets, function (subset) {
          if (vertical[`${sample}_${subset}`]) {
            var vert = createVerticalSeries(
              `${vertical.gene} ${props.type} in ${sample}_${subset}`,
              [[vertical[`${sample}_${props.bcType}`] || 0, vertical[`${sample}_${subset}_height`]], [vertical[`${sample}_${props.bcType}`] || 0, 0]],
              props.colorMaps.vertical[`${sample}_${subset}`]
            )
            plotLines++
            newSeries.push(vert)
          }
        })
      })
      this.plotLines = plotLines
      this.setState({ series: newSeries })
    }
  }

  componentDidMount () {
    var props = this.props
    var requests = _.map(props.samples, function (sample) {
      return axios.get('/api/bellcurve',
      { params: {
          study: props.study,
          sample: sample,
          subsets: props.subsets,
          type: props.type
        }})
    })

    var series = []
    axios.all(requests)
      .then(axios.spread((...responses) => {
        const medianVals = {}
        _.each(responses, (r) => {
          // full data line
          var sample = r.config.params.sample
          var curve = createCurveSeries(sample,
             r.data[0].curve, props.colorMaps.curve[sample])
          var hgram = createHistogramSeries(sample,
             r.data[0].hgram, props.colorMaps.histogram[sample])
          series.push(curve, hgram)
          if (props.setMedianVals) {
            medianVals[sample] = r.data[0].median
          }
          // subset lines
          var index = 1 // each subset follows main line in array of results
          _.each(props.subsets, function (subset) {
            var subsetSample = `${sample}_${subset}`
            var curve = createCurveSeries(subsetSample,
               r.data[index].curve, props.colorMaps.curve[subsetSample])
            var hgram = createHistogramSeries(subsetSample,
               r.data[index].hgram, props.colorMaps.histogram[subsetSample])
            series.push(curve, hgram)
            if (props.setMedianVals) {
              medianVals[subsetSample] = r.data[index].median
            }
            index++
          })
        })
        this.setState({ series: series })
        if (props.setMedianVals) {
          props.setMedianVals(medianVals)
        }
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
                text: this.state.xLabel,
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
                text: this.state.yLabel,
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