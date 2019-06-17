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

// Return RBP json filtered to remove 'NA'
// and match range
function rangeFilter (rvals, min, max) {
  return _.pickBy(rvals, function (value) {
    return value !== 'N/A' &&
    // If either min or max defined make
    // appropriate comparison
    (min == null || value > min) &&
    (max == null || value < max)
  })
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
    // TODO: sanitize 'sample' before it gets frisky
    return pool.query(`SELECT ${sample}_log2 FROM mcf10a_vs_mcf7 WHERE ${sample}_log2 != 'Infinity'`)
      .then(function (result) {
        var log2fpkms = _.map(result.rows, (r) => r[`${sample}_log2`])
        return computeCurve(log2fpkms, sample)
      })
  },

  vertical: function (gene) {
    // Computes verticals to display on bellcurve
    return pool.query(`
      SELECT
        gene,
        mcf10a_fpkm,
        mcf7_fpkm,
        mcf10a_log2,
        mcf7_log2,
        pvalue,
        log2_foldchange
      FROM mcf10a_vs_mcf7
      WHERE gene = $1
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
    // Convert genes array to genes array for psql
    var genesList = _.join(genes, ',')
    genesList = `'{` + genesList + `}'`

    return pool.query(`
      SELECT
        key,
        gene,
        mcf10a_fpkm,
        mcf7_fpkm,
        mcf10a_log2,
        mcf7_log2
      FROM
        mcf10a_vs_mcf7
      JOIN
        unnest(${genesList}::varchar[]) WITH ORDINALITY t(gene, key) USING (gene)
      ORDER BY t.key
    `)
  },

  rbpRvalues: function (gene, min, max) {
    // Returns RBP names with corresponing Rvalue for gene in sorted order
    return pool.query(`SELECT rvalue FROM rbp_rvalues WHERE gene = '${gene}'`)
      .then(function (results) {
        if (results.rows.length < 1) {
          return [] // gene not found
        }
        // Pass just json with gene:correlation
        var filteredRvals = rangeFilter(results.rows[0].rvalue, min, max)
        // Map to object with gene and rvals as keys
        var mappedRvals = _.map(filteredRvals, function (value, gene) {
          return { RBP: gene, Rvalue: value }
        })
        return _.reverse(_.sortBy(mappedRvals, function (o) {
          return o.Rvalue // We use reciprocal to achieve descending sort
        }))
      })
  },

  intronAnalysisHeatmap: function (gene) {
    return pool.query(`SELECT * FROM mcf_intron_psi WHERE gene = '${gene}' ORDER BY intron_number`)
      .then(function (results) {
        if (results.rows.length < 1) {
          return [] // gene not found
        }
        return results
      })
  }
}
