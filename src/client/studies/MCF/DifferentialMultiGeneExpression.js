import React from 'react'
import { MCFService } from '../../services'
import { Content, Row, HeatMapChart } from '../../components/'
import { CSVLink } from 'react-csv'
import { Button, Table } from 'antd'
import TextArea from 'antd/lib/input/TextArea'
import { createHeatMapSeries, getQuartiles } from '../shared-utils'
import _ from 'lodash'

// Columns for table
const columns = [
  { title: 'No.', dataIndex: 'key' },
  { title: 'Gene', dataIndex: 'gene', width: '20%' },
  { title: 'MCF10A FPKM', dataIndex: 'mcf10a_fpkm', width: '20%' },
  { title: 'MCF7 FPKM', dataIndex: 'mcf7_fpkm', width: '20%' },
  { title: 'MCF10A LOG2 FPKM', dataIndex: 'mcf10a_log2', width: '20%' },
  { title: 'MCF7 LOG2 FPKM', dataIndex: 'mcf7_log2', width: '20%' }
]

// Headers for csv export
const headers = [
  { label: 'Gene', key: 'gene' },
  { label: 'MCF10A FPKM', key: 'mcf10a_fpkm' },
  { label: 'MCF7 FPKM', key: 'mcf7_fpkm' },
  { label: 'MCF10A LOG2 FPKM', key: 'mcf10a_log2' },
  { label: 'MCF7 LOG2 FPKM', key: 'mcf7_log2' }
]

const QUARTILE_FLOAT = 0.25

class DifferentialMultiGeneExpression extends React.Component {
  state = {
    yAxisCategories: [],
    yAxisMin: 0,
    yAxisMax: 0,
    chartData: [],
    tableData: []
  }

  service = new MCFService()

  heatMapType = 'fpkm'

  searchText = ''

  updateSearchText = evt => {
    this.searchText = evt.target.value
  }

  handleCtrlEnter = evt => {
    if (evt.key === 'Enter' && evt.ctrlKey) {
      this.performSearch()
    }
  }

  performSearch = () => {
    const newlineTokens = _.split(this.searchText, '\n') // Split newline tokens
    const filteredTokens = _.filter(newlineTokens, t => t !== '')
    const genes = _.map(filteredTokens, t => _.trim(t).toUpperCase()) // Trim whitespaces and convert to uppercase
    this.service.getHeatMap(genes, this.heatMapType).then(data => {
      const series = createHeatMapSeries(
        data,
        this.service.samples,
        sample => `${sample}_log2`,
        true
      )
      const range = getQuartiles(series, QUARTILE_FLOAT)
      const yAxisCategories = _.map(data, d => d.gene)

      this.setState({
        tableData: data,
        chartData: series,
        yAxisCategories: yAxisCategories,
        yAxisMin: range.min,
        yAxisMax: range.max
      })
    })
  }

  render() {
    return (
      <Content>
        <Row>
          <h1>Differential Multi Gene Expression</h1>
        </Row>
        <Row>
          Enter a gene in each line. Press Ctrl + Enter or click on the search button to search.
        </Row>
        <Row>
          <TextArea
            rows={4}
            placeholder='Enter newline separated list of genes here.'
            onChange={this.updateSearchText}
            onKeyUp={this.handleCtrlEnter}
            style={{ width: '50%' }}
          />
        </Row>
        <Row>
          <Button type='primary' icon='search' onClick={this.performSearch}>
            Search
          </Button>
        </Row>
        <Row>
          <HeatMapChart
            series={this.state.chartData}
            xAxisCategories={_.map(this.service.samples, sample => sample.toUpperCase())}
            yAxisCategories={this.state.yAxisCategories}
            yAxisMin={this.state.yAxisMin}
            yAxisMax={this.state.yAxisMax}
            yAxisLabel={false}
            tooltipFormatter={function () {
              return `Log2 FPKM for <b>${this.series.yAxis.categories[this.point.y]}</b>
              in <b>${this.series.xAxis.categories[this.point.x]}</b>: <b>${this.point.value}</b>`
            }}
            filename={'mcf_heat_map'}
          />
        </Row>
        <Row>
          <Table
            dataSource={this.state.tableData}
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
          <CSVLink data={this.state.tableData} headers={headers} filename={'heatmapData.csv'}>
            <Button type='primary' icon='download' size={'large'}>
              Export as .csv
            </Button>
          </CSVLink>
        </Row>
      </Content>
    )
  }
}

export { DifferentialMultiGeneExpression }
