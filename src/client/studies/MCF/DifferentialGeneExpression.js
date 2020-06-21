import React from 'react'
import { MCFService } from '../../services'
import { Content, Row, BellCurveChart } from '../../components/'
import { createCurveSeries, createVerticalSeries } from '../shared-utils'
import { Input, Table, Alert } from 'antd'
import _ from 'lodash'
const { Search } = Input

const columns = [
  { title: 'Gene', dataIndex: 'gene' },
  { title: 'MCF10A FPKM', dataIndex: 'mcf10a_fpkm' },
  { title: 'MCF7 FPKM', dataIndex: 'mcf7_fpkm' },
  { title: 'p-value', dataIndex: 'pvalue' },
  { title: 'Fold Change (log2)', dataIndex: 'log2_foldchange' }
]

const colorMaps = {
  curve: { mcf10a: 'blue', mcf7: 'red' },
  vertical: { mcf10a: 'blue', mcf7: 'red' }
}

class DifferentialGeneExpression extends React.Component {
  state = {
    chartData: [],
    tableData: [],
    alertText: ''
  }

  service = new MCFService()

  bellCurveType = 'fpkm'

  verticals = false

  performSearch = gene => {
    this.setState({ alertText: null })

    if (!gene) {
      this.setState({ alertText: 'Please enter a gene name.' })
      return
    }

    this.service.getVertical(gene, this.bellCurveType).then(data => {
      if (!data) {
        this.setState({ alertText: `${gene} not found! Please try another gene.` })
        return
      }

      // If log2_foldchange is null, represent as 'Infinity'
      if (data.log2_foldchange == null) {
        data.log2_foldchange = 'Infinity'
      }

      // Display data in table row
      const tableData = [data]

      // Check if any samples have zero FPKM and
      // generate a warning for them
      const zeroSamples = []
      _.each(this.service.samples, sample => {
        if (data[`${sample}_fpkm`] === 0) {
          zeroSamples.push(sample.toUpperCase())
        }
      })
      const warning = zeroSamples.length > 0 ? `${gene} has FPKM of zero for ${zeroSamples}.` : ''

      // Newly created verticals will be appended to chartData
      const chartData = this.state.chartData

      // Remove any old verticals
      if (this.verticals) {
        _.each(this.service.samples, () => chartData.pop())
      }

      // Create new verticals for each sample
      _.each(this.service.samples, sample => {
        const name = `${gene.toUpperCase()} FPKM in ${sample.toUpperCase()}`
        // Generate x,y coords that draw the vertical line
        // Default x to 0 when log2 values are undefined
        const coords = [
          [data[`${sample}_log2`] || 0, 0],
          [data[`${sample}_log2`] || 0, data[`${sample}_height`]]
        ]
        const color = colorMaps.vertical[sample]

        const vertical = createVerticalSeries(name, coords, color)
        chartData.push(vertical)
      })

      this.verticals = true
      this.setState({
        chartData: chartData,
        tableData: tableData,
        alertText: warning
      })
    })
  }

  componentDidMount() {
    // Load BellCurveChart data on mount
    this.service.getBellCurve(this.bellCurveType).then(data => {
      const series = []

      _.each(data, dataPerSample => {
        const sample = dataPerSample.sample
        const curve = createCurveSeries(
          sample,
          dataPerSample.data[0].curve,
          colorMaps.curve[sample]
        )
        series.push(curve)
      })

      this.setState({
        chartData: series
      })
    })
  }

  render() {
    let alert = null

    if (this.state.alertText) {
      alert = (
        <Alert message={this.state.alertText} type='error' style={{ width: '30%' }} showIcon />
      )
    }

    return (
      <Content>
        <Row>
          <h1>Differential Gene Expression</h1>
        </Row>
        <Row>{alert}</Row>
        <Row>
          <Search
            size='large'
            placeholder='Enter gene name here, eg: MAPK14'
            onSearch={this.performSearch}
            style={{ width: '30%' }}
            enterButton
          />
        </Row>
        <Row>
          <Table
            dataSource={this.state.tableData}
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
            series={this.state.chartData}
            xLabel={'Log2 FPKM'}
            yLabel={'Frequency'}
            filename={'mcf_bell_curve'}
          />
        </Row>
      </Content>
    )
  }
}

export { DifferentialGeneExpression }
