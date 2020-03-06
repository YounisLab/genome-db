import React from 'react'
import DifferentialGeneExpression from './DifferentialGeneExpression'
import Heatmap from './HeatMap'
import IntronAnalysis from './IntronAnalysis'

class MCF extends React.Component {
  render () {
    return (
      <React.Fragment>
        <DifferentialGeneExpression />
        <Heatmap />
        <IntronAnalysis />
      </React.Fragment>
    )
  }
}

export { MCF }
