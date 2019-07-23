import React from 'react'
import styles from './styles'
import Row from './Row'
import HeatMapChart from './HeatMapChart'
import { CSVLink } from 'react-csv'
import { Layout, Input, Button, Table } from 'antd'
const axios = require('axios')
const _ = require('lodash')
const { Content } = Layout
const { TextArea } = Input

const columns = [{
  title: 'No.',
  dataIndex: 'key'
},
{
  title: 'Gene',
  dataIndex: 'gene',
  width: '20%'
}, {
  title: 'MCF10A FPKM',
  dataIndex: 'mcf10a_fpkm',
  width: '20%'
}, {
  title: 'MCF7 FPKM',
  dataIndex: 'mcf7_fpkm',
  width: '20%'
}, {
  title: 'MCF10A LOG2 FPKM',
  dataIndex: 'mcf10a_log2',
  width: '20%'
}, {
  title: 'MCF7 LOG2 FPKM',
  dataIndex: 'mcf7_log2',
  width: '20%'
}]

const headers = [
  { label: 'Gene', key: 'gene' },
  { label: 'MCF10A FPKM', key: 'mcf10a_fpkm' },
  { label: 'MCF7 FPKM', key: 'mcf7_fpkm' },
  { label: 'MCF10A LOG2 FPKM', key: 'mcf10a_log2' },
  { label: 'MCF7 LOG2 FPKM', key: 'mcf7_log2' }
]

class HeatMap extends React.Component {
  constructor (props) {
    super(props)

    this.text = ''
    this.state = {
      data: []
    }

    this.updateText = this.updateText.bind(this)
    this.getHeatMap = this.getHeatMap.bind(this)
    this.doSearch = this.doSearch.bind(this)
  }

  updateText (evt) {
    this.text = evt.target.value
  }

  getHeatMap () {
    var newlineTokens = _.split(this.text, '\n') // Split newline tokens
    var trimmedTokens = _.map(newlineTokens, (t) => _.trim(t).toUpperCase()) // Trim whitespaces
    axios.post('/api/heatmap', {
      genes: _.filter(trimmedTokens, (t) => t !== '') // Filter out empty strings
    })
      .then(resp => {
        this.setState({ data: resp.data })
      })
  }

  doSearch (evt) {
    if (evt.key === 'Enter' && evt.ctrlKey) {
      this.getHeatMap()
    }
  }

  render () {
    return (
      <Content style={styles.contentStyle}>
        <div style={styles.contentDivStyle}>
          <Row>
            <h1>Differential Multi-Gene Expression</h1>
          </Row>
          <Row>
            Enter a gene in each line. Press Ctrl + Enter or click on the search button to search.
          </Row>
          <Row>
            <TextArea
              rows={4}
              placeholder='Enter newline separated list of genes here.'
              onChange={this.updateText}
              onKeyUp={this.doSearch}
              style={{ width: '50%' }} />
          </Row>
          <Row>
            <Button type='primary' icon='search' onClick={this.getHeatMap}>Search</Button>
          </Row>
          <Row>
            <HeatMapChart
              // _.reverse to maintain input order when displaying in Heatmap Chart
              data={_.reverse(
                _.map(this.state.data, (d) => {
                  return _.pick(d, ['gene', 'mcf10a_log2', 'mcf7_log2'])
                })
              )}
            />
          </Row>
          <Row>
            <Table
              dataSource={this.state.data}
              columns={columns}
              size={'small'}
              bordered
              pagination={false}
              style={{ width: '75%' }}
              locale={{ emptyText: 'Enter list of genes to show results' }}
              scroll={{ y: 240 }}
            />
          </Row>
          <Row>
            <CSVLink
              data={this.state.data}
              headers={headers}
              filename={'heatmapData.csv'}>
              <Button
                type='primary'
                icon='download'
                size={'large'}
              >
                  Export as .csv
              </Button>
            </CSVLink>
          </Row>
        </div>
      </Content>
    )
  }
}

export default HeatMap
