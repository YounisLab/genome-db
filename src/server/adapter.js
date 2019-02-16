const { Pool } = require('pg')
const _ = require('lodash')
const d3 = require('d3')
const math = require('mathjs')

var pool

function NormalDensityZx (x, Mean, StdDev, scaleFactor) {
  var a = x - Mean
  return (Math.exp(-(a * a) / (2 * StdDev * StdDev)) / (Math.sqrt(2 * Math.PI) * StdDev)) * scaleFactor
}

function computeCurve (dataPoints, sample) {
  var binGenerator = d3.histogram().thresholds(d3.thresholdScott)

  var bins = binGenerator(dataPoints)
  var mean = math.mean(dataPoints)
  var stddev = math.std(dataPoints)

  // We use a hash to get O(1) access to x-axis values (categories)
  var pointsHash = {}
  _.each(bins, function (bin) {
    var point = { 'sample': sample, 'category': bin.x0 }
    point[sample + '_curve'] = NormalDensityZx(bin.x0, mean, stddev, Math.abs(bin.x1 - bin.x0) * dataPoints.length)
    point[sample + '_hgram'] = bin.length
    pointsHash[bin.x0] = point
  })

  return pointsHash
}

// amcharts requires that multiple graphs
// contain their values in the same object.
function mergeSamples (pointsPerSample) {
  // Merge unique x-axis points across all samples
  var xPoints = _.reduce(pointsPerSample, function (allPoints, samplePoints) {
    return allPoints.concat(Object.keys(samplePoints))
  }, [])
  xPoints = _.uniq(xPoints)

  // Merge common points
  var mergedPoints = []
  _.each(xPoints, function (x) {
    var mergedPoint = { category: parseFloat(x) }
    _.each(pointsPerSample, function (p) {
      // If x-point exists
      if (p[x]) {
        var sample = p[x].sample
        mergedPoint[sample + '_curve'] = p[x][sample + '_curve']
        mergedPoint[sample + '_hgram'] = p[x][sample + '_hgram']
      }
    })
    mergedPoints.push(mergedPoint)
  })

  // Sort by category
  mergedPoints = _.sortBy(mergedPoints, ['category'])
  return mergedPoints
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

  bellCurve: function (samples) {
    // Computes smooth histogram curve of fpkms
    var queries = _.map(samples, (s) => {
      return pool.query(`SELECT log2 FROM ${s} WHERE log2 != 'Infinity'`)
    })

    return Promise.all(queries)
      .then(function (results) {
        // Accumulate points for all samples
        var pointsPerSample = _.map(samples, function (sample, index) {
          var log2fpkms = _.map(results[index].rows, row => row.log2)
          return computeCurve(log2fpkms, sample)
        })

        return mergeSamples(pointsPerSample)
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
