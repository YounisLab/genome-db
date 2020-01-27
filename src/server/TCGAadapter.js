const _ = require('lodash')
const util = require('./utility')

const queryParams = {'bellcurve': {'median': {'tcga': ['tcga_brca_genes_median', 'median_log2_norm_count_plus_1']}},
                      'vertical': {'median': ['mcf10a_vs_mcf7', 'gene, median_log2_norm_count_plus_1', 'median_log2_norm_count_plus_1']}}
const subsetParams = {'rbp': 'rbp_genes',
                      'u12': 'u12_genes'}

var pool
var binsHash = {} // To compute height of verticals

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

  bellCurve: function (sample, subsets, type) {
    // Computes smooth histogram curve of fpkms
    // TODO: sanitize 'sample' before it gets frisky
    var [tableName, columnName] = queryParams['bellcurve'][type][sample]
    var lines = []
    // var [tableName, columnName] = queryParams[type][subsets]
    var line = pool.query(`SELECT ${columnName} FROM ${tableName} WHERE ${columnName} != 'Infinity'`)
      .then(function (result) {
        var log2fpkms = _.map(result.rows, (r) => r[columnName])
        return util.computeCurve(binsHash, log2fpkms, `${sample}_${type}`)
      })
    lines.push(line)
    // add each subset line
    _.each(subsets, function(subset) {
      var subsetTable = subsetParams[subset]
      line = pool.query(`SELECT ${columnName} FROM ${tableName}
                          INNER JOIN ${subsetTable}
                          ON ${tableName}.gene = ${subsetTable}.gene
                          WHERE ${columnName} is not null`)
        .then(function (result) {
          var log2fpkms = _.map(result.rows, (r) => r[columnName])
          return util.computeCurve(binsHash, log2fpkms, `${sample}_${subset}_${type}`)
        })
        lines.push(line)
    })
    return Promise.all(lines)
      .then(function (values) {
        return values
      })
  },

  vertical: function (gene, subsets, type) {
    // Computes verticals to display on bellcurve
    var [tableName, columnNames, dataType] = queryParams['vertical'][type]
    return pool.query(`
      SELECT ${columnNames}
      FROM ${tableName}
      WHERE gene = $1
    `, [gene])
      .then(function (results) {
        if (results.rows.length < 1) {
          return [] // gene not found
        }
        var subsetVerticals = _.map(subsets, function (subset) {
          var subsetTable = subsetParams[subset]
          // check if gene is in subset dataset
          return pool.query(`
            SELECT 1 FROM ${subsetTable} WHERE gene= '${gene}'
          `)
          .then(function (subsetResults) {
            return (subsetResults.rows.length > 0)
          })
        })
        // wait for all promises to execute
        return Promise.all(subsetVerticals)
          .then(function (values) {
            _.each(['mcf10a', 'mcf7'], function (sample) {
              // find vertical for sample
              if (binsHash[`${sample}_${type}`]) {
                results.rows[0][`${sample}_height`] = util.NormalDensityZx(
                  results.rows[0][`${sample}_${dataType}`],
                  binsHash[`${sample}_${type}`].mean,
                  binsHash[`${sample}_${type}`].stddev,
                  binsHash[`${sample}_${type}`].scaleFactor)
              }
              // get subset verticals
              _.forEach(subsets, function (subset, index) {
                if (values[index] && binsHash[`${sample}_${subset}_${type}`]) {
                  results.rows[0][`${sample}_${subset}`] = true
                  results.rows[0][`${sample}_${subset}_height`] = util.NormalDensityZx(
                    results.rows[0][`${sample}_${dataType}`],
                    binsHash[`${sample}_${subset}_${type}`].mean,
                    binsHash[`${sample}_${subset}_${type}`].stddev,
                    binsHash[`${sample}_${subset}_${type}`].scaleFactor)
                }
              })
            })
            console.log(results)
            return results
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
