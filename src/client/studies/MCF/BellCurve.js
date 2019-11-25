import React from 'react'
import styles from '../../shared/styles'
import Row from '../../shared/Row'
import BellCurveChart from './BellCurveChart'
import { Layout, Input, Table, Alert } from 'antd'
const { Content } = Layout
const { Search } = Input
const axios = require('axios')
const _ = require('lodash')

const columns = [{
  title: 'Gene',
  dataIndex: 'gene'
}, {
  title: 'MCF10A FPKM',
  dataIndex: 'mcf10a_fpkm'
}, {
  title: 'MCF7 FPKM',
  dataIndex: 'mcf7_fpkm'
}, {
  title: 'p-value',
  dataIndex: 'pvalue'
}, {
  title: 'log2 Foldchange',
  dataIndex: 'log2_foldchange'
}]

class BellCurve extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      data: [],
      alertText: null,
      samples: ['mcf10a', 'mcf7'],
      subsets: [],
      type: 'fpkm'
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
        study: 'mcf',
        gene: gene.toUpperCase(), // DB stores gene names in UPPERCASE,
        subsets: this.state.subsets,
        type: this.state.type
      }
    })
      .then(resp => {
        var alertText = null
        if (resp.data.length < 1) {
          this.setState({ alertText: `${gene} not found! Please try another name.` })
          return
        }

        // Check if any FPKMs are zero
        var zeroSamples = []
        _.each(this.state.samples, function (sample) {
          if (resp.data[0][`${sample}_fpkm`] === 0) {
            zeroSamples.push(sample.toUpperCase())
          }

          alertText = zeroSamples.length > 0 ? `${gene} has FPKM of zero for ${zeroSamples}.` : ''
        })

        // Check if log2_foldchange is null
        if (resp.data[0].log2_foldchange == null) {
          resp.data[0].log2_foldchange = 'Infinity'
        }

        this.setState({
          data: resp.data,
          alertText: alertText
        })
      })
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
          <Row>
            <BellCurveChart
              vertical={this.state.data}
              samples={this.state.samples}
              subsets={this.state.subsets}
              type={this.state.type}
            />
          </Row>
        </div>
      </Content>
    )
  }
}

export default BellCurve
