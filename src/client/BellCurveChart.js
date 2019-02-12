import React from 'react'
import AmCharts from '@amcharts/amcharts3-react'
const axios = require('axios')

function NormalDensityZx (x, Mean, StdDev) {
  var a = x - Mean
  return Math.exp(-(a * a) / (2 * StdDev * StdDev)) / (Math.sqrt(2 * Math.PI) * StdDev)
}

var verticals = [
  -1.4, -0.2, 1.2
]

var chartData = []
for (var i = -5; i < 5.1; i += 0.1) {
  var dp = {
    category: i,
    value: NormalDensityZx(i, 0, 1)
  }
  if (verticals.indexOf(Math.round(i * 10) / 10) !== -1) {
    dp.vertical = dp.value
  }
  chartData.push(dp)
}

var chartConfig = {
  'type': 'serial',
  'theme': 'light',
  'dataProvider': chartData,
  'precision': 2,
  'valueAxes': [ {
    'gridAlpha': 0.2,
    'dashLength': 0
  } ],
  'startDuration': 1,
  'graphs': [ {
    'balloonText': '[[category]]: <b>[[value]]</b>',
    'lineThickness': 3,
    'valueField': 'value'
  }, {
    'balloonText': '',
    'fillAlphas': 1,
    'type': 'column',
    'valueField': 'vertical',
    'fixedColumnWidth': 2,
    'labelText': '[[value]]',
    'labelOffset': 20
  } ],
  'chartCursor': {
    'categoryBalloonEnabled': false,
    'cursorAlpha': 0,
    'zoomable': false
  },
  'categoryField': 'category',
  'categoryAxis': {
    'gridAlpha': 0.05,
    'startOnAxis': true,
    'tickLength': 5,
    'labelFunction': function (label, item) {
      return '' + Math.round(item.dataContext.category * 10) / 10
    }
  }
}

class BellCurveChart extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      // Array of arrays.
      // Each internal array corresponds to a sample.
      data: []
    }
  }
  render () {
    return (
      <div>
        <AmCharts.React style={{ width: '100%', height: '500px' }} options={chartConfig} />
      </div>
    )
  }
}

export default BellCurveChart
