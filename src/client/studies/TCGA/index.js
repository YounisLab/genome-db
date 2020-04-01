import React from 'react'

import { MedianDistribution } from './MedianDistribution'
import { Correlations } from './Correlations'

class TCGA extends React.Component {
  render() {
    return (
      <React.Fragment>
        <MedianDistribution />
        <Correlations />
      </React.Fragment>
    )
  }
}

export { TCGA }
