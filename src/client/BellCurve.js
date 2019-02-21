import React from 'react'
import styles from './styles'
import Row from './Row'
import BellCurveChart from './BellCurveChart'
import { Layout, Input, Table, Alert } from 'antd'
const { Content } = Layout
const { Search } = Input
const axios = require('axios')

const columns = [{
  title: 'Gene',
  dataIndex: 'gene',
  key: 'gene'
}, {
  title: 'MCF10A FPKM',
  dataIndex: 'mcf10a_fpkm',
  key: 'mcf10a_fpkm'
}, {
  title: 'MCF7 FPKM',
  dataIndex: 'mcf7_fpkm',
  key: 'mcf7_fpkm'
}, {
  title: 'p-value',
  dataIndex: 'pvalue',
  key: 'pvalue'
}, {
  title: 'log2 Foldchange',
  dataIndex: 'log2_foldchange',
  key: 'log2_foldchange'
}]

class BellCurve extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      data: [],
      alertText: null,
      samples: ['mcf10a', 'mcf7']
    }

    this.getBellCurve = this.getBellCurve.bind(this)
  }
  getBellCurve (gene) {
    this.setState({ alertText: null })
    if (!gene) {
      this.setState({ alertText: 'Please enter a gene name.' })
      return
    }

    axios.get('/api/vertical', {
      params: {
        gene: gene.toUpperCase() // DB stores gene names in UPPERCASE
      }
    })
      .then(resp => {
        if (resp.data.length < 1) {
          this.setState({ alertText: 'Gene not found! Please try another name.' })
          return
        }

        this.setState({
          data: resp.data,
          alertText: null
        })
      })
  }
  render () {
    let alert

    if (this.state.alertText) {
      alert = <Alert message={this.state.alertText} type='error' style={{ width: '30%' }} />
    } else {
      alert = null
    }

    return (
      <Content style={styles.contentStyle}>
        <div style={styles.contentDivStyle}>
          <Row>
            <h1>Differential Gene Expression</h1>
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
            <BellCurveChart
              vertical={this.state.data}
              samples={this.state.samples}
            />
          </Row>
          <Row>
            <Table
              dataSource={this.state.data}
              columns={columns}
              size={'small'}
              bordered
              pagination={false}
              style={{ width: '50%' }}
              locale={{ emptyText: 'Search for gene names to show results' }}
            />
          </Row>
        </div>
      </Content>
    )
  }
}

export default BellCurve
