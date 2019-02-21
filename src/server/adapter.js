const { Pool } = require('pg')
const _ = require('lodash')
const d3 = require('d3')
const math = require('mathjs')

var pool
var binsHash = {} // To compute height of verticals

function NormalDensityZx (x, Mean, StdDev, scaleFactor) {
  var a = x - Mean
  return (Math.exp(-(a * a) / (2 * StdDev * StdDev)) / (Math.sqrt(2 * Math.PI) * StdDev)) * scaleFactor
}

// Return points adjusted to normal curve
// and histogram
function computeCurve (dataPoints, sample) {
  var binGenerator = d3.histogram().thresholds(d3.thresholdScott)

  var bins = binGenerator(dataPoints)
  var mean = math.mean(dataPoints)
  var stddev = math.std(dataPoints)
  // Take average width of bins
  var avgBinWidth = _.reduce(bins, function (sum, bin) {
    return sum + Math.abs(bin.x1 - bin.x0)
  }, 0)
  avgBinWidth = avgBinWidth / bins.length
  var scaleFactor = avgBinWidth * dataPoints.length

  // Store for computing height of vertical later
  if (!binsHash[sample]) {
    binsHash[sample] = {
      mean: mean,
      stddev: stddev,
      scaleFactor: scaleFactor
    }
  }

  var points = { curve: [], hgram: [] }

  _.each(bins, function (bin) {
    var curvePoint = NormalDensityZx(bin.x0, mean, stddev, scaleFactor)
    var hgramPoint = bin.length

    points.curve.push([bin.x0, curvePoint])
    points.hgram.push([bin.x0, hgramPoint])
  })

  return points
}

module.exports = {
  connect: function (urlObject) {
    var host = urlObject.host
    console.log('Connecting to postgres at', host)
    pool = new Pool({
      connectionString: urlObject.href
    })

    return pool.query('SELECT NOW() as now')
      .then(function (res) {
        console.log('Connected to postgres on', res.rows[0].now)
      })
  },

  bellCurve: function (sample) {
    // Computes smooth histogram curve of fpkms
    return pool.query(`SELECT log2 FROM ${sample} WHERE log2 != 'Infinity'`)
      .then(function (result) {
        var log2fpkms = _.map(result.rows, (r) => r.log2)
        return computeCurve(log2fpkms, sample)
      })
  },

  vertical: function (gene) {
    // Computes verticals to display on bellcurve
    return pool.query(`
      SELECT
        mcf10a.gene,
        mcf10a.fpkm AS mcf10a_fpkm,
        mcf7.fpkm AS mcf7_fpkm,
        mcf10a.log2 AS mcf10a_log2,
        mcf7.log2 AS mcf7_log2,
        mcf10a_vs_mcf7.pvalue,
        mcf10a_vs_mcf7.log2_foldchange
      FROM mcf10a
      INNER JOIN mcf7 ON mcf10a.gene = mcf7.gene
      INNER JOIN mcf10a_vs_mcf7 ON mcf10a.gene = mcf10a_vs_mcf7.gene
      WHERE mcf10a.gene = $1
    `, [gene])
      .then(function (results) {
        if (results.rows.length < 1) {
          return [] // gene not found
        }
        _.each(['mcf10a', 'mcf7'], function (sample) {
          if (binsHash[sample]) {
            results.rows[0][`${sample}_height`] = NormalDensityZx(
              results.rows[0][`${sample}_log2`],
              binsHash[sample].mean,
              binsHash[sample].stddev,
              binsHash[sample].scaleFactor
            )
          }
        })
        return results
      })
  },

  heatMap: function (genes) {
    // Convert genes array to genes list for psql
    genes = _.map(genes, function (gene) {
      return `'${gene}'`
    })
    var genesList = _.join(genes, ',')
    genesList = '(' + genesList + ')'

    return pool.query(`
      SELECT
        row_number() OVER () AS key,
        mcf10a.gene,
        mcf10a.fpkm AS mcf10a_fpkm,
        mcf7.fpkm AS mcf7_fpkm,
        mcf10a.log2 AS mcf10a_log2,
        mcf7.log2 AS mcf7_log2
      FROM
        mcf10a
      INNER JOIN mcf7
      ON mcf10a.gene = mcf7.gene
      WHERE
        mcf10a.gene IN ${genesList}
    `)
  }
}
