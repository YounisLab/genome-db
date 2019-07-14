import React from 'react'
import styles from './styles'
import Row from './Row'
import BellCurveChartTCGA from './BellCurveChartTCGA'
import { Layout, Input, Table, Alert } from 'antd'
const { Content } = Layout
const { Search } = Input
const axios = require('axios')

const columns = [{
  title: 'TCGA median',
  dataIndex: 'tcga',
  width: '20%'
},
{
  title: 'TCGA RBP median',
  dataIndex: 'tcga_rbp',
  width: '20%'
}, {
  title: 'TCGA U12 median',
  dataIndex: 'tcga_u12',
  width: '20%'
}]

class BellCurveTCGA extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      data: [],
      alertText: null,
      sample: 'tcga',
      medianValsP: []
    }

    this.getBellCurve = this.getBellCurve.bind(this)
    this.setMedianVals = this.setMedianVals.bind(this)
  }
  getBellCurve (gene) {
    this.setState({ alertText: null })
    if (!gene) {
      this.setState({ alertText: 'Please enter a gene name.' })
      return
    }

    axios.get('/api/vertical-tcga', {
      params: {
        gene: gene.toUpperCase() // DB stores gene names in UPPERCASE
      }
    })
      .then(resp => {
        var alertText = null
        if (resp.data.length < 1) {
          this.setState({ alertText: `${gene} not found! Please try another name.` })
          return
        }

        // Check if median value is zero
        if (resp.median_log2_norm_count_plus_1 === -1) {
          alertText = `${gene} has median log2 norm count plus one of -1`
        }

        this.setState({
          data: resp.data,
          alertText: alertText
        })
      })
  }

  setMedianVals (medianVals) {
    // key parameter expected by antd
    medianVals['key'] = 1
    // We need to put it in an array to make table work
    this.setState({ medianVals: [medianVals] })
  }

  render () {
    let alert

    if (this.state.alertText) {
      alert = <Alert message={this.state.alertText} type='error' style={{ width: '30%' }} showIcon />
    } else {
      alert = null
    }

    return (
      <Content style={styles.contentStyle}>
        <div style={styles.contentDivStyle}>
          <Row>
            <h1>Median Distribution</h1>
          </Row>
          <Row>
            {alert}
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
              dataSource={this.state.medianVals}
              columns={columns}
              size='small'
              bordered
              pagination={false}
              style={{ width: '75%' }}
              locale={{ emptyText: 'Please wait while data loads' }}
            />
          </Row>
          <Row>
            <BellCurveChartTCGA
              vertical={this.state.data}
              sample={this.state.sample}
              setMedianVals={this.setMedianVals}
            />
          </Row>
        </div>
      </Content>
    )
  }
}

export default BellCurveTCGA
