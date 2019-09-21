import React from 'react'
import BellCurve from './BellCurve'
import Heatmap from './HeatMap'
import IntronAnalysis from './IntronAnalysis'

class ComponentMCF extends React.Component {
  render () {
    return (
      <React.Fragment>
        <BellCurve />
        <Heatmap />
        <IntronAnalysis />
      </React.Fragment>
    )
  }
}

export default ComponentMCF
