import React, { Component } from 'react'
import BellCurve from './BellCurve'
import HeatMap from './HeatMap'
import RBP from './RBP'
import IntronAnalysis from './IntronAnalysis'
import BellCurveTCGA from './BellCurveTCGA';
import StudySelector from './StudySelector'
import { Layout } from 'antd'
const { Header } = Layout

class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      study: 'mcf'
    }

    this.onSelection = this.onSelection.bind(this)
  }

  onSelection (selection) {
    this.setState({ study: selection })
  }

  render () {
    let components = []

    if (this.state.study === 'mcf') {
      components.push(<BellCurve />, <HeatMap />, <IntronAnalysis />)
    } else {
      components.push(<BellCurveTCGA />, <RBP />)
    }

    return (
      <div>
        <Layout>
          <Header>
            <h1 style={{ color: 'white' }}>
              GenomeDB
            </h1>
          </Header>
          <StudySelector onSelection={this.onSelection} />
          {
            components.map(cmp => {
              return (
                <span>
                  { cmp }
                </span>
              )
            })
          }
        </Layout>
      </div>
    )
  }
}

export default App
