import React from 'react'
import styles from './styles'
import Row from './Row'
import { Layout, Input, Table, Alert } from 'antd'
const { Content } = Layout

class RBP extends React.Component {
  render () {
    return (
      <Content style={styles.contentStyle}>
        <div style={styles.contentDivStyle}>
          <Row>
            <h1>RBPs List</h1>
          </Row>
        </div>
      </Content>
    )
  }
}

export default RBP
