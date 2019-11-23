const _ = require('lodash')
const util = require('./utility')

const queryParams = {'fpkm': {'mcf7': ['mcf10a_vs_mcf7', 'mcf7_log2'],
                              'mcf10a': ['mcf10a_vs_mcf7', 'mcf10a_log2']},
                     'psi': {'mcf7': ['mcf_avg_psi', 'mcf7_avg_log2_psi'],
                              'mcf10a': ['mcf_avg_psi', 'mcf10a_avg_log2_psi']}}
const subsetParams = {'rbp': 'rbp_genes',
                      'u12': 'u12_genes'}
var pool
var binsHash = {} // To compute height of verticals

module.exports = {
  setPool: function (dbObj) {
    pool = dbObj
    return 0
  },

  bellCurve: function (sample, subsets, type) {
    // Computes smooth histogram curve of fpkms
    // TODO: sanitize 'sample' before it gets frisky
    var [tableName, columnName] = queryParams[type][sample]
    var lines = []
    // var [tableName, columnName] = queryParams[type][subsets]
    var line = pool.query(`SELECT ${columnName} FROM ${tableName} WHERE ${columnName} != 'Infinity'`)
      .then(function (result) {
        var log2fpkms = _.map(result.rows, (r) => r[columnName])
        return util.computeCurve(binsHash, log2fpkms, sample + type)
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
          return util.computeCurve(binsHash, log2fpkms, sample + type + subset)
        })
        lines.push(line)
    })
    return Promise.all(lines)
      .then(function (values) {
        return values
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
            results.rows[0][`${sample}_height`] = util.NormalDensityZx(
              results.rows[0][`${sample}_log2`],
              binsHash[`${sample}_fpkm`].mean,
              binsHash[`${sample}_fpkm`].stddev,
              binsHash[`${sample}_fpkm`].scaleFactor
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

  intronAnalysisHeatmap: function (gene) {
    return pool.query(`
      SELECT intron_number,
      mcf10a_log2_psi, mcf7_log2_psi
      FROM mcf_intron_psi WHERE gene = '${gene}' ORDER BY intron_number
    `)
      .then(function (results) {
        if (results.rows.length < 1) {
          return [] // gene not found
        }
        return results
      })
  },

  intronAnalysisVertical: function (gene) {
    // Computes verticals to display on bellcurve
    return pool.query(`
      SELECT
        gene,
        mcf10a_avg_log2_psi,
        mcf7_avg_log2_psi
      FROM mcf_avg_psi
      WHERE gene = $1
    `, [gene])
      .then(function (results) {
        if (results.rows.length < 1) {
          return [] // gene not found
        }
        // Check if gene is in the u12 dataset
        return pool.query(`
          SELECT 1 FROM u12_genes WHERE gene= '${gene}'
        `)
          .then(function (u12Results) {
            var u12 = u12Results.rows.length > 0
            _.each(['mcf10a', 'mcf7'], function (sample) {
              _.each(u12 ? [sample, sample + '_u12'] : [sample],
                function (key) {
                  if (binsHash[key + '_ia']) {
                    results.rows[0][`${key}_height`] = util.NormalDensityZx(
                      results.rows[0][`${sample}_avg_log2_psi`],
                      binsHash[key + '_ia'].mean,
                      binsHash[key + '_ia'].stddev,
                      binsHash[key + '_ia'].scaleFactor
                    )
                  }
                })
              results.rows[0].u12 = u12
            })
            return results
          })
      })
  }
}
