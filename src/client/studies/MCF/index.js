import React from 'react'
import { DifferentialGeneExpression } from './DifferentialGeneExpression'
import { DifferentialMultiGeneExpression } from './DifferentialMultiGeneExpression'
import { IntronAnalysis } from './IntronAnalysis'

class MCF extends React.Component {
  render() {
    return (
      <React.Fragment>
        <DifferentialGeneExpression />
        <DifferentialMultiGeneExpression />
        <IntronAnalysis />
      </React.Fragment>
    )
  }
}

export { MCF }
