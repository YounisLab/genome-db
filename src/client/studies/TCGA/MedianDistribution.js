import React from 'react'
import { TCGAService } from '../../services'
import { Table, Alert } from 'antd'
import { Content, Row, BellCurveChart } from '../../components/'
import { createCurveSeries, createVerticalSeries } from '../shared-utils'
import Search from 'antd/lib/input/Search'
import _ from 'lodash'

const columns = [
  { title: 'TCGA median', dataIndex: 'tcga', width: '20%' },
  { title: 'TCGA RBP median', dataIndex: 'tcga_rbp', width: '20%' },
  { title: 'TCGA U12 median', dataIndex: 'tcga_u12', width: '20%' }
]

const colorMaps = {
  curve: { tcga: '#77a1e5', tcga_rbp: 'green', tcga_u12: '#f28f43' },
  vertical: { tcga: '#77a1e5', tcga_rbp: 'green', tcga_u12: '#f28f43' }
}

class MedianDistribution extends React.Component {
  state = {
    chartData: [],
    alertText: ''
  }

  service = new TCGAService()

  bellCurveType = 'median'

  verticals = 0

  performSearch = gene => {
    this.service.getVertical(gene, this.bellCurveType, this.service.subsets).then(data => {
      if (!data) {
        this.setState({ alertText: `${gene} not found! Please try another name.` })
        return
      }

      let alertText = ''
      if (data.median_log2_norm_count_plus_1 === -1) {
        alertText = `${gene} has median log2 norm count plus one of -1`
      }

      const chartData = this.state.chartData

      // Remove any old verticals
      _.times(this.verticals, () => _.each(this.service.samples, () => chartData.pop()))

      let verticals = 0

      const x1 = data.median_log2_norm_count_plus_1 || 0
      // Create vertical for full tcga distribution
      let coords = [
        [x1, data.tcga_height],
        [x1, 0]
      ]
      const vertical = createVerticalSeries(
        `${gene.toUpperCase()} median`,
        coords,
        colorMaps.vertical.tcga
      )
      chartData.push(vertical)
      verticals++

      // Add verticals for subsets
      _.each(this.service.subsets, function (subset) {
        if (data[subset]) {
          // Generate x,y coords for subset verticals
          coords = [
            [x1, data[`tcga_${subset}_height`]],
            [x1, 0]
          ]

          const subsetVertical = createVerticalSeries(
            `${gene.toUpperCase()} median_${subset}`,
            coords,
            colorMaps.vertical[`tcga_${subset}`]
          )

          chartData.push(subsetVertical)
          verticals++
        }
      })

      this.verticals = verticals
      this.setState({
        chartData: chartData,
        alertText: alertText
      })
    })
  }

  componentDidMount() {
    this.service.getBellCurve(this.bellCurveType, this.service.subsets).then(data => {
      const series = []
      const medianVals = {}

      _.each(data, dataPerSample => {
        const sample = dataPerSample.sample
        const curve = createCurveSeries(
          sample,
          dataPerSample.data[0].curve,
          colorMaps.curve[sample]
        )
        series.push(curve)
        medianVals[sample] = dataPerSample.data[0].median

        _.each(this.service.subsets, function (subset, index) {
          // subset data starts from index = 1
          const subsetData = dataPerSample.data[index + 1]
          const subsetSample = `${sample}_${subset}`
          const subsetCurve = createCurveSeries(
            subsetSample,
            subsetData.curve,
            colorMaps.curve[subsetSample]
          )
          series.push(subsetCurve)
          medianVals[subsetSample] = subsetData.median
        })
      })

      // 'key' is expected by antd
      medianVals.key = 1

      this.setState({
        chartData: series,
        medianVals: [medianVals] // antd table expects array as input
      })
    })
  }

  render() {
    let alert

    if (this.state.alertText) {
      alert = (
        <Alert message={this.state.alertText} type='error' style={{ width: '30%' }} showIcon />
      )
    } else {
      alert = null
    }

    return (
      <Content>
        <Row>
          <h1>Median Distribution</h1>
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
          <BellCurveChart
            series={this.state.chartData}
            xLabel={'Log2 Median'}
            yLabel={'Frequency'}
          />
        </Row>
      </Content>
    )
  }
}

export { MedianDistribution }
