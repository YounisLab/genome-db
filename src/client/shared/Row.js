import React from 'react'
import styles from './styles'
import { Row as AntRow } from 'antd'

class Row extends React.Component {
  render () {
    return (
      <AntRow style={styles.rowStyle}>
        {this.props.children}
      </AntRow>
    )
  }
}

export default Row
