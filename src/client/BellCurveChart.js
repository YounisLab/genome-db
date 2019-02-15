import React from 'react'
import AmCharts from '@amcharts/amcharts3-react'
const axios = require('axios')
const _ = require('lodash')

const colorMaps = {
  mcf10a: 'blue',
  mcf7: 'green'
}

const samples = ['mcf10a', 'mcf7']

function createCurveGraph (sample, color) {
  return {
    'title': `${sample}_curve`,
    'lineThickness': 3,
    'lineColor': color,
    'valueField': `${sample}_curve`,
    'showBalloon': false
  }
}

function createHistogramGraph (sample, color) {
  return {
    'title': `${sample}_hgram`,
    'fillColors': color,
    'fillAlphas': 0.9,
    'lineColor': '#fff',
    'lineAlpha': 0.7,
    'type': 'column',
    'valueField': `${sample}_hgram`,
    'showBalloon': false
  }
}

class BellCurveChart extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      dataProvider: []
    }
  }
  componentDidMount () {
    var curveGraphs = _.map(samples, (s) => createCurveGraph(s, colorMaps[s]))
    var histGraphs = _.map(samples, (s) => createHistogramGraph(s, colorMaps[s]))

    axios.post('/api/bellcurve', { samples: samples })
      .then((results) => {
        this.setState({
          dataProvider: results.data,
          graphs: _.concat(curveGraphs, histGraphs)
        })
      })
  }
  render () {
    return (
      <div>
        <AmCharts.React style={{ width: '100%', height: '500px' }}
          options={{
            'type': 'serial',
            'theme': 'light',
            'fontFamily': 'Liberation Sans',
            'dataProvider': this.state.dataProvider,
            'precision': 2,
            'valueAxes': [{
              'gridAlpha': 0.2,
              'dashLength': 0,
              'title': 'Frequency',
              'titleFontSize': '20'
            }],
            'legend': {
              'useGraphSettings': true,
              'fontSize': 15,
              'position': 'top',
              'align': 'right',
              'valueWidth': 70
            },
            'categoryAxis': {
              'gridAlpha': 0.05,
              'startOnAxis': true,
              'tickLength': 1,
              'labelFunction': function (label, item) {
                return '' + Math.round(item.dataContext.category * 10) / 10
              },
              'title': 'log2 FPKM',
              'titleFontSize': '20'
            },
            'startDuration': 1,
            'graphs': this.state.graphs,
            'chartCursor': {
              'categoryBalloonEnabled': true,
              'cursorAlpha': 0,
              'zoomable': true
            },
            'categoryField': 'category'
          }}
        />
      </div>
    )
  }
}

export default BellCurveChart
