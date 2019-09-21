import React from 'react'
import BellCurve from './BellCurve'
import Correlations from './Correlations'

class ComponentTCGA extends React.Component {
  render () {
    return (
      <React.Fragment>
        <BellCurve />
        <Correlations />
      </React.Fragment>
    )
  }
}

export default ComponentTCGA
