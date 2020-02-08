import React from 'react'
import { Layout } from 'antd'
const { Content: AntContent } = Layout

const contentStyle = {
  padding: '20px'
}

const divStyle = {
  background: '#fff',
  padding: 24
}

class Content extends React.Component {
  render () {
    return (
      <AntContent style={contentStyle}>
        <div style={divStyle}>
          {this.props.children}
        </div>
      </AntContent>
    )
  }
}

export { Content }
