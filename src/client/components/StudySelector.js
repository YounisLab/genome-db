import React from 'react'
import { Content } from './Content'
import { Select } from 'antd'
const { Option } = Select

class StudySelector extends React.Component {
  render() {
    return (
      <Content>
        <div style={{ background: '#fff', padding: 24 }}>
          <h1>Select a study to explore:</h1>
          <Select
            size='large'
            showSearch
            style={{ width: 500, fontSize: 20 }}
            defaultValue='mcf'
            onSelect={selection => {
              this.props.onSelection(selection)
            }}
          >
            <Option value='mcf' style={{ fontSize: 16 }}>
              MCF
            </Option>
            <Option value='tcga_brca' style={{ fontSize: 16 }}>
              TCGA BRCA
            </Option>
          </Select>
        </div>
      </Content>
    )
  }
}

export { StudySelector }
