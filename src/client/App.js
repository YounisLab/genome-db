import 'antd/dist/antd.css'
import React, { Component } from 'react'
import BellCurve from './BellCurve'
import { Layout } from 'antd'
const { Header } = Layout

class App extends Component {
  render () {
    return (
      <div>
        <Layout>
          <Header>
            <h1 style={{ color: 'white' }}>
              GenomeDB
            </h1>
          </Header>
          <BellCurve />
        </Layout>
      </div>
    )
  }
}

export default App
