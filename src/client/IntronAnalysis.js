import React from 'react'
import styles from './styles'
import Row from './Row'
import IntronAnalysisHeatmapChart from './IntronAnalysisHeatmapChart'
import { Layout, Input } from 'antd'
const axios = require('axios')
const { Content } = Layout
const { Search } = Input

class IntronAnalysis extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      data: []
    }
    this.getHeatMap = this.getHeatMap.bind(this)
  }
  getHeatMap (gene) {
    axios.get('/api/intron-analysis-heatmap', {
      params: {
        gene: gene.toUpperCase()
      }
    })
      .then(resp => {
        this.setState({ data: resp.data })
      })
  }

  render () {
    return (
      <Content style={styles.contentStyle}>
        <div style={styles.contentDivStyle}>
          <Row>
            <h1>Intron Analysis</h1>
          </Row>
          <Row>
            <Search
              size='large'
              placeholder='Enter gene name here, eg: MAPK14'
              onSearch={this.getHeatMap}
              style={{ width: '30%' }}
              enterButton
            />
          </Row>
          <Row>
            <IntronAnalysisHeatmapChart
              data={this.state.data}
            />
          </Row>
        </div>
      </Content>
    )
  }
}

export default IntronAnalysis
