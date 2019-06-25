import React from 'react'
import styles from './styles'
import { Layout, Select } from 'antd'
const { Option } = Select
const { Content } = Layout

class StudySelector extends React.Component {
  render () {
    return (
      <Content style={styles.contentStyle}>
        <div style={{
          background: '#fff',
          padding: 24
        }}>
          <h1>Select a study to explore:</h1>
          <Select
            size='large'
            showSearch
            style={{ width: 500, fontSize: 20 }}
            defaultValue='mcf'
            onSelect={(selection) => {
              this.props.onSelection(selection)
            }}
          >
            <Option value='mcf' style={{ fontSize: 16 }}>MCF</Option>
            <Option value='tcga_brca' style={{ fontSize: 16 }}>TCGA BRCA</Option>
          </Select>
        </div>
      </Content>
    )
  }
}

export default StudySelector
