import _ from 'lodash'
import d3 from 'd3'
import math from 'mathjs'

export function NormalDensityZx(x, Mean, StdDev, scaleFactor) {
  const a = x - Mean
  return (
    (Math.exp(-(a * a) / (2 * StdDev * StdDev)) / (Math.sqrt(2 * Math.PI) * StdDev)) * scaleFactor
  )
}

// Return points adjusted to normal curve
// and histogram
export function computeCurve(binsHash, dataPoints, sample) {
  const binGenerator = d3.histogram().thresholds(d3.thresholdScott)

  const bins = binGenerator(dataPoints)
  const mean = math.mean(dataPoints)
  const stddev = math.std(dataPoints)
  // Take average width of bins
  let avgBinWidth = _.reduce(
    bins,
    function (sum, bin) {
      return sum + Math.abs(bin.x1 - bin.x0)
    },
    0
  )
  avgBinWidth = avgBinWidth / bins.length
  const scaleFactor = avgBinWidth * dataPoints.length

  // Store for computing height of vertical later
  if (!binsHash[sample]) {
    binsHash[sample] = {
      mean: mean,
      stddev: stddev,
      scaleFactor: scaleFactor
    }
  }
  const points = { curve: [], hgram: [], median: null }

  _.each(bins, function (bin) {
    const curvePoint = NormalDensityZx(bin.x0, mean, stddev, scaleFactor)
    const hgramPoint = bin.length

    points.curve.push([bin.x0, curvePoint])
    points.hgram.push([bin.x0, hgramPoint])
    points.median = math.median(dataPoints)
  })

  return points
}
