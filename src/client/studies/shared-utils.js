const _ = require('lodash')

export function createCurveSeries (sample, data, color) {
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

export function createHistogramSeries (sample, data, color) {
  return {
    name: `${sample} histogram`,
    type: 'column',
    data: data,
    color: color,
    visible: false
  }
}

export function createVerticalSeries (sample, data, color) {
  return {
    name: `${sample}`,
    type: 'line',
    data: data,
    color: color,
    pointWidth: 5,
    dashStyle: 'Dash'
  }
}

export function createHeatMapSeries (data, samples) {
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
