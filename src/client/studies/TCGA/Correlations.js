import React from 'react'
import { Content, Row } from '../../components/'
import { TCGAService } from '../../services/TCGAService'
import { Button, Input, Table, Alert, Radio } from 'antd'
import { CSVLink } from 'react-csv'
const { Search } = Input
const { Group } = Input
const _ = require('lodash')

class Correlations extends React.Component {
  state = {
    data: [],
    alertText: null
  }

  service = new TCGAService()

  dataset = 'RBP'

  generateCSVHeaders = (label) => {
    return [
      { label: label, key: 'gene' },
      { label: 'Rvalue', key: 'Rvalue' }
    ]
  }

  generateTableColumns = (title) => {
    return [
      { title: title, dataIndex: 'gene', width: '40%' },
      { title: 'Rvalue', dataIndex: 'Rvalue', sorter: (a, b) => a.Rvalue - b.Rvalue }
    ]
  }

  columns = this.generateTableColumns(this.dataset)

  headers = this.generateCSVHeaders(this.dataset)

  input = {
    gene: '',
    minimum: '',
    maximum: ''
  }

  performSearch = (evt) => {
    if (evt.key === 'Enter') {
      this.getRvals(this.input.gene)
    }
  }

  updateVal = (evt, key) => {
    this.input[key] = _.trim(evt.target.value)
  }

  setDataset = (e) => {
    this.dataset = e.target.value
  }

  getRvals = (gene) => {
    const min = this.input.minimum
    const max = this.input.maximum

    this.setState({ alertText: null })
    if (!gene) {
      this.setState({ alertText: 'Please enter a gene name.' })
      return
    }

    // Check for non-numeric input/whitespace
    if (min !== '' && !_.isFinite(parseFloat(min))) {
      this.setState({ alertText: 'Please enter numerical Minimum value.' })
      return
    }
    if (max !== '' && !_.isFinite(parseFloat(max))) {
      this.setState({ alertText: 'Please enter numerical Maximum value.' })
      return
    }
    if (parseFloat(min) > parseFloat(max)) {
      this.setState({ alertText: 'Please ensure Minimum < Maximum.' })
      return
    }

    this.service.getCorrelations(gene, this.dataset, min, max)
      .then(data => {
        if (!data) {
          if (min !== '' || max !== '') {
            this.setState({ alertText: `${gene} not found for given range! Please try another entry.` })
          } else {
            this.setState({ alertText: `${gene} not found! Please try another name.` })
          }
          return
        }
        // If request goes through update header and column
        this.columns = this.generateTableColumns(this.dataset)
        this.headers = this.generateCSVHeaders(this.dataset)
        this.setState({ data: data, alertText: null })
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
      <Content>
        <Row>
          <h1>Correlations</h1>
        </Row>
        <Row>
          Select desired data for correlation analysis
        </Row>
        <Row>
          <Radio.Group onChange={this.setDataset} defaultValue={'RBP'}>
            <Radio value={'RBP'}>RBP</Radio>
            <Radio value={'U12'}>U12</Radio>
          </Radio.Group>
        </Row>
        <Row>
          {alert}
        </Row>
        <Row>
          <Search
            size='large'
            placeholder='Enter gene name here, eg: MAPK14'
            onSearch={this.getRvals}
            style={{ width: '30%' }}
            onChange={(e) => this.updateVal(e, 'gene')}
            enterButton
          />
        </Row>
        <Row>
          Enter range of desired correlation values.
          Leave blank to not restrict values.
        </Row>
        <Row>
          <Group compact size='medium'>
            <Input
              style={{
                width: 60, textAlign: 'center', pointerEvents: 'none', color: '#000000'
              }}
              defaultValue='From'
              disabled
            />
            <Input style={{ width: '10%' }}
              placeholder='Minimum'
              onChange={(e) => this.updateVal(e, 'minimum')}
              onKeyUp={this.performSearch}
            />
            <Input
              style={{
                width: 40, textAlign: 'center', pointerEvents: 'none', color: '#000000'
              }}
              defaultValue='to'
              disabled
            />
            <Input style={{ width: '10%' }}
              placeholder='Maximum'
              onChange={(e) => this.updateVal(e, 'maximum')}
              onKeyUp={this.performSearch}
            />
          </Group>
        </Row>
        <Row>
          <Table
            dataSource={this.state.data}
            columns={this.columns}
            size={'medium'}
            bordered
            pagination={false}
            style={{ width: '35%' }}
            locale={{ emptyText: 'Enter gene name to show results' }}
            scroll={{ y: 500 }}
          />
        </Row>
        <Row>
          <CSVLink
            data={this.state.data}
            headers={this.headers}
            filename={`${this.input.gene}.csv`}>
            <Button
              type='primary'
              icon='download'
              size={'large'}
            >
                Export as .csv
            </Button>
          </CSVLink>
        </Row>
      </Content>
    )
  }
}

export { Correlations }
