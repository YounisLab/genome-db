import React from 'react'
import { TCGAService } from '../../services'
import { Table, Alert } from 'antd'
import { Content, Row, BellCurveChart } from '../../components/'
import { createCurveSeries, createHistogramSeries, createVerticalSeries } from '../shared-utils'
import Search from 'antd/lib/input/Search'
import _ from 'lodash'

const columns = [
  { title: 'TCGA median', dataIndex: 'tcga', width: '20%' },
  { title: 'TCGA RBP median', dataIndex: 'tcga_rbp', width: '20%' },
  { title: 'TCGA U12 median', dataIndex: 'tcga_u12', width: '20%' }
]

const colorMaps = {
  curve: { tcga: '#77a1e5', tcga_rbp: 'green', tcga_u12: '#f28f43' },
  histogram: { tcga: '#77a1e5', tcga_rbp: 'green', tcga_u12: '#f28f43' },
  vertical: { tcga: '#77a1e5', tcga_rbp: 'green', tcga_u12: '#f28f43' }
}

class MedianDistribution extends React.Component {
  state = {
    chartData: [],
    alertText: ''
  }

  service = new TCGAService()

  bellCurveType = 'median'

  verticals = false

  performSearch = (gene) => {
    this.service.getVertical(gene, this.bellCurveType, this.service.subsets)
      .then(data => {
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
        if (this.verticals) {
          _.each(this.service.samples, () => chartData.pop())
        }

        const x1 = data.median_log2_norm_count_plus_1 || 0
        // Create vertical for full tcga distribution
        const coords = [
          [x1, data.tcga_height],
          [x1, 0]
        ]
        const vertical = createVerticalSeries(
          `${gene} median`,
          coords,
          colorMaps.vertical.tcga
        )
        chartData.push(vertical)

        this.verticals = true
        this.setState({
          chartData: chartData,
          alertText: alertText
        })
      })
  }

  componentDidMount () {
    this.service.getBellCurve(this.bellCurveType, this.service.subsets)
      .then(data => {
        const series = []
        const medianVals = {}

        _.each(data, dataPerSample => {
          const sample = dataPerSample.sample
          const curve = createCurveSeries(sample, dataPerSample.data[0].curve, colorMaps.curve[sample])
          const hgram = createHistogramSeries(sample, dataPerSample.data[0].hgram, colorMaps.histogram[sample])
          series.push(curve, hgram)
          medianVals[sample] = dataPerSample.data[0].median

          _.each(this.service.subsets, function (subset, index) {
            // subset data starts from index = 1
            const subsetData = dataPerSample.data[index + 1]
            const subsetSample = `${sample}_${subset}`
            const subsetCurve = createCurveSeries(subsetSample, subsetData.curve, colorMaps.curve[subsetSample])
            const subsetHgram = createHistogramSeries(subsetSample, subsetData.hgram, colorMaps.histogram[subsetSample])
            series.push(subsetCurve, subsetHgram)
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

  render () {
    let alert

    if (this.state.alertText) {
      alert = <Alert message={this.state.alertText} type='error' style={{ width: '30%' }} showIcon />
    } else {
      alert = null
    }

    return (
      <Content>
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
