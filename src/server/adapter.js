const { Pool } = require('pg')
const _ = require('lodash')
const d3 = require('d3')
const math = require('mathjs')

var pool

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

  var points = { curve: [], hgram: [] }

  _.each(bins, function (bin) {
    var curvePoint = NormalDensityZx(bin.x0, mean, stddev, Math.abs(bin.x1 - bin.x0) * dataPoints.length)
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
      mcf10a.fpkm AS mcf10A_fpkm,
      mcf7.fpkm AS mcf7_fpkm,
      mcf10a.log2 AS mcf10A_log2,
      mcf7.log2 AS mcf7_log2,
      mcf10a_vs_mcf7.pvalue,
      mcf10a_vs_mcf7.log2_foldchange
    FROM mcf10a
    INNER JOIN mcf7 ON mcf10a.gene = mcf7.gene
    INNER JOIN mcf10a_vs_mcf7 ON mcf10a.gene = mcf10a_vs_mcf7.gene
    WHERE mcf10a.gene = $1
    `, [gene])
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
      mcf10a.fpkm AS mcf10A_fpkm,
      mcf7.fpkm AS mcf7_fpkm
    FROM
      mcf10a
    INNER JOIN mcf7
    ON mcf10a.gene = mcf7.gene
    WHERE
      mcf10a.gene IN ${genesList}
    `)
  }
}
