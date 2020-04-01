import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

/*
  props = {
    xLabel: label for xAxis
    yLabel: label for yAxis
    series: data to be drawn (HighCharts series format)
  }
*/
class BellCurveChart extends React.Component {
  render() {
    return (
      <div>
        <HighchartsReact
          highcharts={Highcharts}
          options={{
            chart: {
              zoomType: 'x'
            },
            legend: {
              align: 'right',
              verticalAlign: 'top',
              layout: 'vertical',
              itemMarginTop: 5,
              itemMarginBottom: 5,
              itemStyle: {
                fontSize: '15px'
              }
            },
            xAxis: [
              {
                title: {
                  text: this.props.xLabel,
                  style: {
                    fontSize: '15px'
                  }
                },
                labels: {
                  style: {
                    fontSize: '15px'
                  }
                }
              }
            ],
            yAxis: [
              {
                title: {
                  text: this.props.yLabel,
                  style: {
                    fontSize: '15px'
                  }
                },
                labels: {
                  style: {
                    fontSize: '15px'
                  }
                }
              }
            ],
            series: this.props.series,
            title: '' // No title needed, overrides default
          }}
        />
      </div>
    )
  }
}

export { BellCurveChart }
