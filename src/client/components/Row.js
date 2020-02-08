import React from 'react'
import { Row as AntRow } from 'antd'

const rowStyle = {
  padding: '5px 0'
}

class Row extends React.Component {
  render () {
    return (
      <AntRow style={rowStyle}>
        {this.props.children}
      </AntRow>
    )
  }
}

export { Row }
