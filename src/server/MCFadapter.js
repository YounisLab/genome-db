const _ = require('lodash')
const util = require('./utility')

var pool
var binsHash = {} // To compute height of verticals

module.exports = {
  setPool: function (dbObj) {
    pool = dbObj
    return 0
  },

  bellCurve: function (sample) {
    // Computes smooth histogram curve of fpkms
    // TODO: sanitize 'sample' before it gets frisky
    return pool.query(`SELECT ${sample}_log2 FROM mcf10a_vs_mcf7 WHERE ${sample}_log2 != 'Infinity'`)
      .then(function (result) {
        var log2fpkms = _.map(result.rows, (r) => r[`${sample}_log2`])
        return util.computeCurve(binsHash, log2fpkms, sample)
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

  intronAnalysisBellCurve: function (sample) {
    // Computes smooth histogram curve of fpkms
    // TODO: sanitize 'sample' before it gets frisky
    var fullDataLine = pool.query(`SELECT ${sample}_avg_log2_psi FROM mcf_avg_psi WHERE ${sample}_avg_log2_psi is not null`)
      .then(function (result) {
        var avgPsiVals = _.map(result.rows, (r) => r[`${sample}_avg_log2_psi`])
        return util.computeCurve(binsHash, avgPsiVals, sample + '_ia')
      })
    var limitedDataLine = pool.query(`SELECT ${sample}_avg_log2_psi FROM mcf_avg_psi INNER JOIN u12_genes ON mcf_avg_psi.gene = u12_genes.gene WHERE ${sample}_avg_log2_psi is not null`)
      .then(function (result) {
        var avgPsiVals = _.map(result.rows, (r) => r[`${sample}_avg_log2_psi`])
        return util.computeCurve(binsHash, avgPsiVals, sample + '_u12_ia')
      })
    return Promise.all([fullDataLine, limitedDataLine])
      .then(function (values) {
        return values
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
