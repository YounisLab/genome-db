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
  var points = { curve: [], hgram: [], median: null }

  _.each(bins, function (bin) {
    var curvePoint = NormalDensityZx(bin.x0, mean, stddev, scaleFactor)
    var hgramPoint = bin.length

    points.curve.push([bin.x0, curvePoint])
    points.hgram.push([bin.x0, hgramPoint])
    points.median = math.median(dataPoints)
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
  setPool: function (dbObj) {
    pool = dbObj
    return 0
  },

  bellCurveTCGA: function (sample) {
    // Computes smooth histogram curve of fpkms
    // TODO: sanitize 'sample' before it gets frisky
    var fullDataLine = pool.query(
      `SELECT median_log2_norm_count_plus_1 FROM tcga_brca_genes_median`)
      .then(function (result) {
        var medianCounts = _.map(result.rows, (r) => {
          return r['median_log2_norm_count_plus_1']
        })
        return computeCurve(medianCounts, sample)
      })

    var rbpDataLine = pool.query(
      `SELECT median_log2_norm_count_plus_1 FROM tcga_brca_genes_median
      INNER JOIN rbp_genes
      ON tcga_brca_genes_median.gene = rbp_genes.gene`)
      .then(function (result) {
        var medianCounts = _.map(result.rows, (r) => {
          return r['median_log2_norm_count_plus_1']
        })
        return computeCurve(medianCounts, sample + '_rbp')
      })
    var u12DataLine = pool.query(
      `SELECT median_log2_norm_count_plus_1 FROM tcga_brca_genes_median
      INNER JOIN u12_genes
      ON tcga_brca_genes_median.gene = u12_genes.gene`)
      .then(function (result) {
        var medianCounts = _.map(result.rows, (r) => {
          return r['median_log2_norm_count_plus_1']
        })
        return computeCurve(medianCounts, sample + '_u12')
      })
    return Promise.all([fullDataLine, rbpDataLine, u12DataLine])
      .then(function (values) {
        return values
      })
  },

  verticalTCGA: function (gene) {
    // Computes verticals to display on bellcurve
    return pool.query(`
      SELECT
        gene,
        median_log2_norm_count_plus_1
      FROM tcga_brca_genes_median
      WHERE gene = $1
    `, [gene])
      .then(function (results) {
        results.rows.u12 = false
        results.rows.rbp = false
        if (results.rows.length < 1) {
          return [] // gene not found
        }
        const samples = ['tcga']
        // Check if gene is in the u12 dataset
        return pool.query(`
          SELECT 1 FROM u12_genes WHERE gene= '${gene}'
        `)
          .then(function (u12Results) {
            if (u12Results.rows.length > 0) {
              samples.push('tcga_u12')
              results.rows[0].u12 = true
            }
            // Check if gene is in rbp dataaset
            return pool.query(`
              SELECT 1 FROM rbp_genes WHERE gene= '${gene}'
            `)
              .then(function (rbpResults) {
                if (rbpResults.rows.length > 0) {
                  samples.push('tcga_rbp')
                  results.rows[0].rbp = true
                }
                _.each(samples, function (sample) {
                  if (binsHash[sample]) {
                    results.rows[0][`${sample}_height`] = NormalDensityZx(
                      results.rows[0][`median_log2_norm_count_plus_1`],
                      binsHash[sample].mean,
                      binsHash[sample].stddev,
                      binsHash[sample].scaleFactor
                    )
                  }
                })
                return results
              })
          })
      })
  },

  correlations: function (table, gene, min, max) {
    // Returns RBP names with corresponing Rvalue for gene in sorted order
    return pool.query(`SELECT rvalue FROM ${table} WHERE gene = '${gene}'`)
      .then(function (results) {
        if (results.rows.length < 1) {
          return [] // gene not found
        }
        // Pass just json with gene:correlation
        var filteredRvals = rangeFilter(results.rows[0].rvalue, min, max)
        // Map to object with gene and rvals as keys
        var mappedRvals = _.map(filteredRvals, function (value, gene) {
          return { gene: gene, Rvalue: value }
        })
        return _.reverse(_.sortBy(mappedRvals, function (o) {
          return o.Rvalue // We use reciprocal to achieve descending sort
        }))
      })
  }
}
