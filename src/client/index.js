import React from 'react'
import ReactDOM from 'react-dom'

import { MCF, TCGA } from './studies'
import { StudySelector } from './components/StudySelector'
import { Layout } from 'antd'
const { Header } = Layout

class App extends React.Component {
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
    let component

    if (this.state.study === 'mcf') {
      component = <MCF />
    } else {
      component = <TCGA />
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
          { component }
        </Layout>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('root'))
