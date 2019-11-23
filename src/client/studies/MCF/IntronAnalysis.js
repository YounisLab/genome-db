import React from 'react'
import styles from '../../shared/styles'
import Row from '../../shared/Row'
import IntronAnalysisHeatmapChart from './IntronAnalysisHeatmapChart'
import IntronAnalysisBellCurveChart from './IntronAnalysisBellCurveChart'
import { Layout, Input, Table } from 'antd'
const axios = require('axios')
const { Content } = Layout
const { Search } = Input

const columns = [{
  title: 'MCF10A median psi',
  dataIndex: 'mcf10a',
  width: '20%'
},
{
  title: 'MCF7 median psi',
  dataIndex: 'mcf7',
  width: '20%'
}, {
  title: 'MCF10A_u12 psi',
  dataIndex: 'mcf10a_u12',
  width: '20%'
}, {
  title: 'MCF7_u12 psi',
  dataIndex: 'mcf7_u12',
  width: '20%'
}]

class IntronAnalysis extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      heatmapData: [],
      bellcurveData: [],
      samples: ['mcf10a', 'mcf7'],
      medianPsi: [],
      subsets: ['u12'],
      type: 'psi'
    }
    this.getHeatMap = this.getHeatMap.bind(this)
    this.getBellCurve = this.getBellCurve.bind(this)
    this.setMedianPsi = this.setMedianPsi.bind(this)
  }

  getHeatMap (gene) {
    axios.get('/api/intron-analysis-heatmap', {
      params: {
        study: 'mcf',
        gene: gene.toUpperCase()
      }
    })
      .then(resp => {
        this.setState({ heatmapData: resp.data })
      })
  }

  getBellCurve (gene) {
    axios.get('/api/intron-analysis-vertical', {
      params: {
        study: 'mcf',
        gene: gene.toUpperCase() // DB stores gene names in UPPERCASE
      }
    })
      .then(resp => {
        this.setState({ bellcurveData: resp.data })
      })
  }

  // Called by IntronAnalysisBellcurve component to get median values
  setMedianPsi (medianPsi) {
    // key parameter expected by antd
    medianPsi['key'] = 1
    // We need to put it in an array to make table work
    this.setState({ medianPsi: [medianPsi] })
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
              data={this.state.heatmapData}
            />
          </Row>
          <Row>
            <Search
              size='large'
              placeholder='Enter gene name here, eg: MAPK14'
              onSearch={this.getBellCurve}
              style={{ width: '30%' }}
              enterButton
            />
          </Row>
          <Row>
            <Table
              dataSource={this.state.medianPsi}
              columns={columns}
              size='small'
              bordered
              pagination={false}
              style={{ width: '75%' }}
              locale={{ emptyText: 'Please wait while data loads' }}
            />
          </Row>
          <Row>
            <IntronAnalysisBellCurveChart
              vertical={this.state.bellcurveData}
              samples={this.state.samples}
              setMedianPsi={this.setMedianPsi}
              subsets={this.state.subsets}
              type={this.state.type}
            />
          </Row>
        </div>
      </Content>
    )
  }
}

export default IntronAnalysis
