import React from 'react'
import { MCFService } from '../../services'
import { Content, Row, BellCurveChart, HeatMapChart } from '../../components/'
import { createCurveSeries, createVerticalSeries, createHeatMapSeries } from '../shared-utils'
import Search from 'antd/lib/input/Search'
import { Table } from 'antd'
import _ from 'lodash'

const columns = [
  { title: 'MCF10A median psi', dataIndex: 'mcf10a', width: '20%' },
  { title: 'MCF7 median psi', dataIndex: 'mcf7', width: '20%' },
  { title: 'MCF10A_u12 psi', dataIndex: 'mcf10a_u12', width: '20%' },
  { title: 'MCF7_u12 psi', dataIndex: 'mcf7_u12', width: '20%' }
]

const colorMaps = {
  curve: { mcf10a: 'blue', mcf7: 'red', mcf10a_u12: 'purple', mcf7_u12: 'green' },
  vertical: { mcf10a: 'blue', mcf7: 'red', mcf10a_u12: 'purple', mcf7_u12: 'green' }
}

class IntronAnalysis extends React.Component {
  state = {
    medianVals: [],
    bellCurveChartData: [],
    xAxisCategories: [],
    yAxisMin: 0,
    yAxisMax: 0,
    heatMapChartData: []
  }

  service = new MCFService()

  bellCurveType = 'psi'
  heatMapType = 'psi'

  verticals = false
  subsetVerticals = false

  performSearch = gene => {
    // performSearch does 2 things:
    // 1. Obtains the verticals for the bellcurvechart
    // 2. Obtains the data for the heatmapchart
    this.service.getVertical(gene, this.bellCurveType, this.service.subsets).then(data => {
      // Newly created verticals will be appended to bellCurveChartData
      const bellCurveChartData = this.state.bellCurveChartData

      if (this.verticals) {
        _.each(this.service.samples, () => bellCurveChartData.pop())
      }
      if (this.subsetVerticals) {
        _.each(this.service.samples, () => bellCurveChartData.pop())
      }

      let subsetVerticals = false

      // Create verticals for each sample
      _.each(this.service.samples, sample => {
        // Add verticals for subsets
        _.each(this.service.subsets, function (subset) {
          const sampleSubset = `${sample}_${subset}`
          if (data[subset]) {
            // Generate x,y coords for subset verticals
            // Default x to 0 when log2 values are undefined
            const coords = [
              [data[`${sample}_avg_log2_psi`] || 0, 0],
              [data[`${sample}_avg_log2_psi`] || 0, data[`${sampleSubset}_height`]]
            ]

            const subsetVertical = createVerticalSeries(
              `${gene.toUpperCase()} psi in ${sampleSubset.toUpperCase()}`,
              coords,
              colorMaps.vertical[sampleSubset]
            )

            bellCurveChartData.push(subsetVertical)
            subsetVerticals = true
          }
        })
      })

      this.verticals = true
      this.subsetVerticals = subsetVerticals
      this.setState({
        bellCurveChartData: bellCurveChartData
      })
    })

    this.service.getHeatMap(gene, this.heatMapType).then(data => {
      const series = createHeatMapSeries(
        data,
        this.service.samples,
        sample => `${sample}_log2_psi`,
        false
      )
      const xAxisCategories = _.map(data, d => d.intron_number)
      const psiVals = _.flatMap(data, d => [d.mcf10a_log2_psi, d.mcf7_log2_psi])

      this.setState({
        heatMapChartData: series,
        xAxisCategories: xAxisCategories,
        yAxisMin: _.min(psiVals),
        yAxisMax: _.max(psiVals)
      })
    })
  }

  componentDidMount() {
    this.service.getBellCurve(this.bellCurveType, this.service.subsets).then(data => {
      const series = []
      const medianVals = {}

      _.each(data, dataPerSample => {
        const sample = dataPerSample.sample
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
        bellCurveChartData: series,
        medianVals: [medianVals] // antd table expects array as input
      })
    })
  }

  render() {
    return (
      <Content>
        <Row>
          <h1>Minor-Intron Splicing Efficiency</h1>
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
          <HeatMapChart
            series={this.state.heatMapChartData}
            xAxisCategories={this.state.xAxisCategories}
            yAxisCategories={_.map(this.service.samples, sample => sample.toUpperCase())}
            yAxisMin={this.state.yAxisMin}
            yAxisMax={this.state.yAxisMax}
            yAxisLabel={true}
            tooltipFormatter={function () {
              return `Psi value for <b>${this.series.yAxis.categories[this.point.y]}</b>
              in intron <b>${this.series.xAxis.categories[this.point.x]}</b>: <b>${
                this.point.value
              }</b>`
            }}
            filename={'intronAnalysisHeatMap'}
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
            series={this.state.bellCurveChartData}
            xLabel={'Log2 Psi'}
            yLabel={'Frequency'}
            filename={'intronAnalysisBellCurve'}
          />
        </Row>
      </Content>
    )
  }
}

export { IntronAnalysis }
