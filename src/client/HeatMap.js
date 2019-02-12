import React from 'react'
import styles from './styles'
import Row from './Row'
import HeatMapChart from './HeatMapChart'
import { Layout, Input, Table, Alert } from 'antd'
const { Content } = Layout
const { TextArea } = Input

class HeatMap extends React.Component {
  render () {
    return (
      <Content style={styles.contentStyle}>
        <div style={styles.contentDivStyle}>
          <Row>
            <h1>HeatMap</h1>
          </Row>
          <Row>
            <TextArea
              rows={4}
              placeholder='Enter comma or newline separated list of genes here.'
              style={{ width: '50%' }} />
          </Row>
          <Row>
            <HeatMapChart />
          </Row>
        </div>
      </Content>
    )
  }
}

export default HeatMap
