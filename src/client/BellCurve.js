import React from 'react'
import styles from './styles'
import { Layout, Input, Table, Alert, Row } from 'antd'
const { Content } = Layout
const { Search } = Input
const axios = require('axios')

const columns = [{
  title: 'No.',
  dataIndex: 'key',
  key: 'key'
},
{
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
      data: []
    }

    this.getBellCurve = this.getBellCurve.bind(this)
  }
  getBellCurve (gene) {
    if (!gene) {
      return
    }

    axios.get('/api/bellcurve', {
      params: {
        gene: gene
      }
    })
      .then(resp => {
        if (resp.data.length < 1) {
          return
        }

        resp.data[0].key = this.state.data.length + 1
        this.state.data.push(resp.data[0])
        this.setState({ data: this.state.data })
      })
  }
  render () {
    return (
      <Content style={styles.contentStyle}>
        <div style={styles.contentDivStyle}>
          <Row>
            <h1>Bell Curve</h1>
          </Row>
          <Row style={styles.rowStyle}>
            {alert}
          </Row>
          <Row style={styles.rowStyle}>
            <Search
              size='large'
              placeholder='Enter gene name here, eg: MAPK14'
              onSearch={this.getBellCurve}
              style={{ width: '30%' }}
              enterButton
            />
          </Row>
          <Row style={styles.rowStyle}>
            <Table
              dataSource={this.state.data}
              columns={columns}
              size={'small'}
              bordered
              pagination={false}
              locale={{ emptyText: 'Search for gene names to show results' }}
            />
          </Row>
        </div>
      </Content>
    )
  }
}

export default BellCurve
